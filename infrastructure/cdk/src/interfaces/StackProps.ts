import * as cdk from 'aws-cdk-lib'

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