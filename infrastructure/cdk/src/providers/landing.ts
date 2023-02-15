import { Construct } from 'constructs'
import { Duration, Stack } from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins'
import { LandingStackProps } from '../interfaces/LandingStackProps'

/**
 * Class representing the landing stack.
 *
 * Shortest name:  {@link LandingStack}
 * Full name:      {@link (LandingStack:class)}
 */
export class LandingStack extends Stack {

  public readonly service: string = 'Landing'
  public readonly assetPath: string = '../../apps/landing/dist'

  /**
   * LandingStack class constructor.
   * 
   * Shortest name:  {@link (LandingStack:constructor)}
   * Full name:      {@link (LandingStack:constructor)}
   */
  constructor(scope: Construct, id: string, props: LandingStackProps) {

    /**
     * LandingStack class constructor super method.
     * 
     * Shortest name:  {@link (LandingStack:constructor:super)}
     * Full name:      {@link (LandingStack:constructor:super)}
     */
    super(scope, id, props)

    const { project, stage, domain, dnsRecords, hostedZone } = props

    // Use casimir.co for prod and dev.casimir.co for dev
    const serviceDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')
    
    const certificate = new certmgr.Certificate(this, `${project}${this.service}Cert${stage}`, {
      domainName: serviceDomain,
      subjectAlternativeNames: [
        [dnsRecords.landing, serviceDomain].join('.')
      ],
      validation: certmgr.CertificateValidation.fromDns(hostedZone)
    })

    const bucket = new s3.Bucket(this, `${project}${this.service}Bucket${stage}`, {
      accessControl: s3.BucketAccessControl.PRIVATE
    })

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, `${project}${this.service}OriginAccessIdentity${stage}`)
    bucket.grantRead(originAccessIdentity)

    const distribution = new cloudfront.Distribution(this, `${project}${this.service}Distribution${stage}`, {
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
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: new cloudfrontOrigins.S3Origin(bucket, { originAccessIdentity })
      },
      domainNames: [serviceDomain, [dnsRecords.landing, serviceDomain].join('.')],
      certificate
    })

    new s3Deployment.BucketDeployment(this, `${project}${this.service}BucketDeployment${stage}`, {
      destinationBucket: bucket,
      sources: [s3Deployment.Source.asset(this.assetPath)],
      distribution,
      distributionPaths: ['/*']
    })

    new route53.ARecord(this, `${project}${this.service}DnsARecord${stage}`, {
      recordName: serviceDomain,
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: Duration.minutes(1),
    })

    new route53.ARecord(this, `${project}${this.service}DnsARecordWww${stage}`, {
      recordName: [dnsRecords.landing, serviceDomain].join('.'),
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: Duration.minutes(1),
    })

  }
}
