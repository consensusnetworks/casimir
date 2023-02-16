import { Construct } from 'constructs'
import { Duration, Stack } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import { AuthStackProps } from '../interfaces/AuthStackProps'

/**
 * Class representing the auth stack.
 *
 * Shortest name:  {@link AuthStack}
 * Full name:      {@link (AuthStack:class)}
 */
export class AuthStack extends Stack {

    public readonly service: string = 'Auth'
    public readonly assetPath: string = '../../services/auth/dist'

    /**
     * AuthStack class constructor.
     * 
     * Shortest name:  {@link (AuthStack:constructor)}
     * Full name:      {@link (AuthStack:constructor)}
     */
    constructor(scope: Construct, id: string, props: AuthStackProps) {

        /**
         * AuthStack class constructor super method.
         * 
         * Shortest name:  {@link (AuthStack:constructor:super)}
         * Full name:      {@link (AuthStack:constructor:super)}
         */
        super(scope, id, props)

        const { project, stage, domain, dnsRecords, hostedZone } = props

        // Use casimir.co for prod and dev.casimir.co for dev
        const serviceDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')

        /** Create an EC2 VPC and an ECS cluster */
        const vpc = new ec2.Vpc(this, `${project}${this.service}Vpc${stage}`)
        const cluster = new ecs.Cluster(this, `${project}${this.service}Cluster${stage}`, { vpc })

        /** Create a certificate for the load balancer */
        const certificate = new certmgr.Certificate(this, `${project}${this.service}Cert${stage}`, {
            domainName: serviceDomain,
            subjectAlternativeNames: [
                [dnsRecords.auth, serviceDomain].join('.')
            ],
            validation: certmgr.CertificateValidation.fromDns(hostedZone)
        })

        /** Create a load-balanced Fargate service and make it public */
        const fargate = new ecsPatterns.ApplicationLoadBalancedFargateService(this, `${project}${this.service}Fargate${stage}`, {
            certificate,
            cluster,
            domainName: [dnsRecords.auth, serviceDomain].join('.'), // e.g. auth.casimir.co or auth.dev.casimir.co
            domainZone: hostedZone,
            taskImageOptions: {
                containerPort: 8080,
                image: ecs.ContainerImage.fromAsset(this.assetPath)
            }
        })

        /** Create a DNS A record for the load balancer */
        new route53.ARecord(this, `${project}${this.service}DnsARecordApi${stage}`, {
            recordName: [dnsRecords.auth, serviceDomain].join('.'),
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(fargate.loadBalancer)),
            ttl: Duration.minutes(1),
        })

    }
}