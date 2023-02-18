import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import { UsersStackProps } from '../interfaces/UsersStackProps'

/**
 * Users API stack
 */
export class UsersStack extends cdk.Stack {
    /** Stack name */
    public readonly name = 'users'
    /** Path to stack build assets or Dockerfile */
    public readonly assetPath = '../../services/users'
    // TODO change auth service to users

    constructor(scope: Construct, id: string, props: UsersStackProps) {
        super(scope, id, props)

        const { project, stage, domain, subdomains, hostedZone } = props

        /** Set the stage root domain */
        const stageDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')

        /** Create an EC2 VPC and an ECS cluster */
        const vpc = new ec2.Vpc(this, `${project}${this.name}Vpc${stage}`)
        const cluster = new ecs.Cluster(this, `${project}${this.name}Cluster${stage}`, { vpc })

        /** Create a certificate for the load balancer */
        const certificate = new certmgr.Certificate(this, `${project}${this.name}Cert${stage}`, {
            domainName: stageDomain,
            subjectAlternativeNames: [
                [subdomains.users, stageDomain].join('.')
            ],
            validation: certmgr.CertificateValidation.fromDns(hostedZone)
        })

        /** Create a load-balanced Fargate service */
        const fargate = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${project}${this.name}Fargate${stage}`, {
            certificate,
            cluster,
            domainName: [subdomains.users, stageDomain].join('.'), // e.g. users.casimir.co or users.dev.casimir.co
            domainZone: hostedZone,
            taskImageOptions: {
                containerPort: 4000,
                image: ecs.ContainerImage.fromAsset(this.assetPath),
                environment: {
                    PROJECT: project,
                    STAGE: stage
                }
            }
        })

        /** Create a DNS A record for the load balancer */
        new route53.ARecord(this, `${project}${this.name}DnsARecordApi${stage}`, {
            recordName: [subdomains.users, stageDomain].join('.'),
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(fargate.loadBalancer)),
            ttl: cdk.Duration.minutes(1)
        })

    }
}