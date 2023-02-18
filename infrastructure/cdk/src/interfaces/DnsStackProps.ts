import * as cdk from 'aws-cdk-lib'

export interface DnsStackProps extends cdk.StackProps {
    project: string
    stage: string
}