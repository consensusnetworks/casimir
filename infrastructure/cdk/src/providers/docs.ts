import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as certmgr from "aws-cdk-lib/aws-certificatemanager"
import * as route53targets from "aws-cdk-lib/aws-route53-targets"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins"
import { DocsStackProps } from "../interfaces/StackProps"
import { pascalCase } from "@casimir/format"
import { Config } from "./config"

/**
 * Docs app stack
 */
export class DocsStack extends cdk.Stack {
    public readonly name = pascalCase("docs")

    constructor(scope: Construct, id: string, props: DocsStackProps) {
        super(scope, id, props)

        const config = new Config()
        const { rootDomain, subdomains } = config
        const { hostedZone, certificate } = props

        const bucket = new s3.Bucket(this, config.getFullStackResourceName(this.name, "bucket"), {
            accessControl: s3.BucketAccessControl.PRIVATE
        })

        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, config.getFullStackResourceName(this.name, "origin-access-identity"))
        bucket.grantRead(originAccessIdentity)

        const distributionCertificate = (() => {
            if (certificate?.env.region === "us-east-1") return certificate
            /** Replace deprecated method when cross-region support is out of beta */
            return new certmgr.DnsValidatedCertificate(this, config.getFullStackResourceName(this.name, "cert"), {
                domainName: rootDomain,
                subjectAlternativeNames: [`${subdomains.docs}.${rootDomain}`],
                hostedZone,
                region: "us-east-1"
            })
        })()

        const redirectFunction = new cloudfront.Function(this, config.getFullStackResourceName(this.name, "redirect"), {
            code: cloudfront.FunctionCode.fromFile({ filePath: "../../services/redirect/dist/index.js" })
        })

        const distribution = new cloudfront.Distribution(this, config.getFullStackResourceName(this.name, "distribution"), {
            certificate: distributionCertificate,
            defaultRootObject: "index.html",
            defaultBehavior: {
                functionAssociations: [{
                    function: redirectFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
                }],
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                origin: new cloudfrontOrigins.S3Origin(bucket, { originAccessIdentity })
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                    ttl: cdk.Duration.minutes(30)
                }, {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: "/index.html",
                    ttl: cdk.Duration.minutes(30)
                }
            ],
            domainNames: [`${subdomains.docs}.${rootDomain}`]
        })

        new s3Deployment.BucketDeployment(this, config.getFullStackResourceName(this.name, "bucket-deployment"), {
            destinationBucket: bucket,
            sources: [s3Deployment.Source.asset("../../apps/docs/dist")],
            distribution,
            distributionPaths: ["/*"],
        })

        new route53.ARecord(this, config.getFullStackResourceName(this.name, "a-record-docs"), {
            recordName: `${subdomains.docs}.${rootDomain}`,
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
            ttl: cdk.Duration.minutes(1),
        })
    }
}