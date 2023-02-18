import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins'
import { LandingStackProps } from '../interfaces/LandingStackProps'
import { pascalCase } from '@casimir/string-helpers'

/**
 * Landing page stack
 */
export class LandingStack extends cdk.Stack {
  /** Stack name */
  public readonly name = pascalCase('landing')
  /** Path to stack build assets or Dockerfile */
  public readonly assetPath = '../../apps/landing/dist'

  constructor(scope: Construct, id: string, props: LandingStackProps) {
    super(scope, id, props)

    const { project, stage, domain, subdomains, hostedZone } = props

    /** Set the stage root domain */
    const stageDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')
    
    /** Create a certificate for the landing page */
    const certificate = new certmgr.Certificate(this, `${project}${this.name}Cert${stage}`, {
      domainName: stageDomain,
      subjectAlternativeNames: [
        [subdomains.landing, stageDomain].join('.')
      ],
      validation: certmgr.CertificateValidation.fromDns(hostedZone)
    })

    /** Create a bucket for the landing page */
    const bucket = new s3.Bucket(this, `${project}${this.name}Bucket${stage}`, {
      accessControl: s3.BucketAccessControl.PRIVATE
    })

    /** Set bucket to allow cloudfront origin */
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, `${project}${this.name}OriginAccessIdentity${stage}`)
    bucket.grantRead(originAccessIdentity)

    /** Create a cloudfront distribution for the landing page */
    const distribution = new cloudfront.Distribution(this, `${project}${this.name}Distribution${stage}`, {
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30)
        }
      ],
      defaultBehavior: {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: new cloudfrontOrigins.S3Origin(bucket, { originAccessIdentity })
      },
      domainNames: [stageDomain, [subdomains.landing, stageDomain].join('.')],
      certificate
    })

    /** Deploy the landing page to the bucket */
    new s3Deployment.BucketDeployment(this, `${project}${this.name}BucketDeployment${stage}`, {
      destinationBucket: bucket,
      sources: [s3Deployment.Source.asset(this.assetPath)],
      distribution,
      distributionPaths: ['/*']
    })

    /** Create an A record for the landing page root */
    new route53.ARecord(this, `${project}${this.name}DnsARecord${stage}`, {
      recordName: stageDomain,
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: cdk.Duration.minutes(1),
    })

    /** Create an A record for the landing page www subdomain */
    new route53.ARecord(this, `${project}${this.name}DnsARecordWww${stage}`, {
      recordName: [subdomains.landing, stageDomain].join('.'),
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      ttl: cdk.Duration.minutes(1),
    })
  }
}
