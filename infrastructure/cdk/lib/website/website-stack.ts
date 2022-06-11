import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'

/**
 * Class representing the website stack.
 *
 * Shortest name:  {@link WebsiteStack}
 * Full name:      {@link (WebsiteStack:class)}
 */
export class WebsiteStack extends Stack {

  /**
   * WebsiteStack class constructor.
   * 
   * Shortest name:  {@link (WebsiteStack:constructor)}
   * Full name:      {@link (WebsiteStack:constructor)}
   */
  constructor(scope: Construct, id: string, props?: StackProps) {

    /**
     * WebsiteStack class constructor super method.
     * 
     * Shortest name:  {@link (WebsiteStack:constructor:super)}
     * Full name:      {@link (WebsiteStack:constructor:super)}
     */
    super(scope, id, props)

    // const stackName = Stack.of(this).stackName
    const project = process.env.PROJECT?.replace(/\b\w/g, c => c.toUpperCase())
    const stage = process.env.STAGE?.replace(/\b\w/g, c => c.toUpperCase())
    const service = 'Website'
    const useDomain = stage === 'Prod'

    const bucket = new Bucket(this, `${project}${service}Bucket${stage}`, {
      accessControl: BucketAccessControl.PRIVATE
    })

    // Todo set path alias for apps
    new BucketDeployment(this, `${project}${service}BucketDeployment${stage}`, {
      destinationBucket: bucket,
      sources: [Source.asset('../../apps/website/dist')]
    })

    const originAccessIdentity = new OriginAccessIdentity(this, `${project}${service}OriginAccessIdentity${stage}`)
    bucket.grantRead(originAccessIdentity)

    if (useDomain) {
      
      const domain = 'casimir.co'

      const hostedZone = route53.HostedZone.fromLookup(this, `${project}${service}HostedZone${stage}`, {
        domainName: domain,
      })

      const certificate = new certmgr.DnsValidatedCertificate(this, `${project}${service}Cert${stage}`, {
        domainName: domain,
        hostedZone,
        region: 'us-east-1'
      })

      const distribution = new Distribution(this, `${project}${service}Distribution${stage}`, {
        defaultRootObject: 'index.html',
        defaultBehavior: {
          origin: new S3Origin(bucket, { originAccessIdentity }),
        },
        domainNames: [domain],
        certificate
      })

      new route53.ARecord(this, `${project}${service}DnsARecord${stage}`, {
        zone: hostedZone as route53.IHostedZone,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
        ttl: Duration.minutes(1),
      })
    }

  }
}
