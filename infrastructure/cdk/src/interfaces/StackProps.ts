import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as route53 from 'aws-cdk-lib/aws-route53'

export type DnsStackProps = cdk.StackProps
export type EtlStackProps = cdk.StackProps
export type NetworkStackProps = cdk.StackProps

export interface LandingStackProps extends cdk.StackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}

export interface NodesStackProps extends cdk.StackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
}

export interface UsersStackProps extends cdk.StackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific ECS cluster */
    cluster: ecs.Cluster
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}