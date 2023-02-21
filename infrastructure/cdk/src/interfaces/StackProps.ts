import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as route53 from 'aws-cdk-lib/aws-route53'

export interface StackProps extends cdk.StackProps {
    /** Project name */
    project: string
    /** Deployment stage name */
    stage: string
    /** Deployment AWS env */
    env: {
        /** AWS account number */
        account: string
        /** AWS region */
        region: string
    } 
}

export type EtlStackProps = StackProps

export interface NetworkStackProps extends StackProps {
    /** Stage-specific root domain (i.e., casimir.co for prod, dev.casimir.co for dev) */
    rootDomain: string 
    /** Stage-specific subdomains (i.e., api.casimir.co for prod, api.dev.casimir.co for dev) */
    subdomains: {
        nodes: string
        landing: string
        users: string    
        wildcard: string
    }
}

export interface LandingStackProps extends NetworkStackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}

export interface NodesStackProps extends NetworkStackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Nodes IP address */
    nodesIp: string
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}

export interface UsersStackProps extends NetworkStackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific ECS cluster */
    cluster: ecs.Cluster
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}