import { StackProps } from 'aws-cdk-lib'

export interface DnsStackProps extends StackProps {
    project: string;
    stage: string;
}