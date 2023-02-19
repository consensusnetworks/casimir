import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { UsersStackProps } from '../interfaces/UsersStackProps'

/**
 * Users API stack
 */
export class UsersStack extends cdk.Stack {
    /** Stack name */
    public readonly name = 'users'
    /** Path to stack build assets or Dockerfile */
    public readonly assetPath = '../../services/users'

    constructor(scope: Construct, id: string, props: UsersStackProps) {
        super(scope, id, props)

        const { project, stage, certificate, cluster, hostedZone, rootDomain, subdomains } = props

        /** Create a load-balanced service for the users express API */
        const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${project}${this.name}Fargate${stage}`, {
            certificate,
            cluster,
            domainName: `${subdomains.users}.${rootDomain}`, // e.g. users.casimir.co or users.dev.casimir.co
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

        /** Create a DNS A record for the users load balancer */
        new route53.ARecord(this, `${project}${this.name}DnsARecord${stage}`, {
            recordName: `${subdomains.users}.${rootDomain}`,
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(service.loadBalancer)),
            ttl: cdk.Duration.minutes(1)
        })

    }
}