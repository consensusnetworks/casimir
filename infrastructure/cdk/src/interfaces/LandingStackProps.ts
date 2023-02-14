import { StackProps } from 'aws-cdk-lib'
import { HostedZone } from 'aws-cdk-lib/aws-route53'

export interface LandingStackProps extends StackProps {
    project: string;
    stage: string;
    domain: string;
    dnsRecords: Record<string, string>;
    hostedZone: HostedZone;
}