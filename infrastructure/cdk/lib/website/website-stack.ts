import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'

export interface WebsiteStackProps extends StackProps {
  project: string;
  stage: string;
  domain: string;
  dnsRecords: Record<string, string>;
  hostedZone: route53.HostedZone;
}

/**
 * Class representing the website stack.
 *
 * Shortest name:  {@link WebsiteStack}
 * Full name:      {@link (WebsiteStack:class)}
 */
export class WebsiteStack extends Stack {

  public readonly service: string = 'Website'
  public readonly assetPath: string = '../../apps/website/dist'

  /**
   * WebsiteStack class constructor.
   * 
   * Shortest name:  {@link (WebsiteStack:constructor)}
   * Full name:      {@link (WebsiteStack:constructor)}
   */
  constructor(scope: Construct, id: string, props: WebsiteStackProps) {

    /**
     * WebsiteStack class constructor super method.
     * 
     * Shortest name:  {@link (WebsiteStack:constructor:super)}
     * Full name:      {@link (WebsiteStack:constructor:super)}
     */
    super(scope, id, props)

    const { project, stage, domain, dnsRecords, hostedZone } = props

    // Use casimir.co for prod and dev.casimir.co for dev
    const serviceDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')
    
    const certificate = new certmgr.DnsValidatedCertificate(this, `${project}${this.service}Cert${stage}`, {
      domainName: serviceDomain,
      subjectAlternativeNames: [
        [dnsRecords.website, serviceDomain].join('.')
      ],
      hostedZone,
      region: 'us-east-1'
    })

    const bucket = new Bucket(this, `${project}${this.service}Bucket${stage}`, {
      accessControl: BucketAccessControl.PRIVATE
    })

    new BucketDeployment(this, `${project}${this.service}BucketDeployment${stage}`, {
      destinationBucket: bucket,
      sources: [Source.asset(this.assetPath)]
    })

    const originAccessIdentity = new OriginAccessIdentity(this, `${project}${this.service}OriginAccessIdentity${stage}`)
    bucket.grantRead(originAccessIdentity)

    const distribution = new Distribution(this, `${project}${this.service}Distribution${stage}`, {
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30)
        }
      ],
      defaultBehavior: {
        origin: new S3Origin(bucket, { originAccessIdentity }),
      },
      domainNames: [serviceDomain, [dnsRecords.website, serviceDomain].join('.')],
      certificate
    })

    new route53.ARecord(this, `${project}${this.service}DnsARecord${stage}`, {
      recordName: serviceDomain,
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: Duration.minutes(1),
    })

    new route53.ARecord(this, `${project}${this.service}DnsARecordWww${stage}`, {
      recordName: [dnsRecords.website, serviceDomain].join('.'),
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: Duration.minutes(1),
    })

  }
}
