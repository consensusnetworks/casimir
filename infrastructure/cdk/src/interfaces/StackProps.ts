import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as route53 from 'aws-cdk-lib/aws-route53'

export interface StackProps extends cdk.StackProps {
    /** Deployment AWS env */
    env: {
        /** AWS account number */
        account: string
        /** AWS region */
        region: string
    } 
}

export type EtlStackProps = StackProps

export type NetworkStackProps = StackProps

export interface LandingStackProps extends StackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}

export interface NodesStackProps extends StackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}

export interface UsersStackProps extends StackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific ECS cluster */
    cluster: ecs.Cluster
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}