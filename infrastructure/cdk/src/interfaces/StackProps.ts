import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as route53 from 'aws-cdk-lib/aws-route53'

export type DnsStackProps = cdk.StackProps
export type AnalyticsStackProps = cdk.StackProps
export type NetworkStackProps = cdk.StackProps

export interface DocsStackProps extends cdk.StackProps {
    certificate: certmgr.Certificate
    hostedZone: route53.HostedZone
}

export interface LandingStackProps extends cdk.StackProps {
    certificate: certmgr.Certificate
    hostedZone: route53.HostedZone
}

export interface WebStackProps extends cdk.StackProps {
    certificate: certmgr.Certificate
    hostedZone: route53.HostedZone
}

export interface NodesStackProps extends cdk.StackProps {
    hostedZone: route53.HostedZone
}

export interface UsersStackProps extends cdk.StackProps {
    certificate: certmgr.Certificate
    hostedZone: route53.HostedZone
    vpc: ec2.Vpc
}