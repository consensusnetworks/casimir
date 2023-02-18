import * as cdk from 'aws-cdk-lib'

export interface EtlStackProps extends cdk.StackProps {
    project: string
    stage: string
}