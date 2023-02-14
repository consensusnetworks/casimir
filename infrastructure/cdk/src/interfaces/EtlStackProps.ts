import { StackProps } from 'aws-cdk-lib'

export interface EtlStackProps extends StackProps {
    project: string;
    stage: string;
}