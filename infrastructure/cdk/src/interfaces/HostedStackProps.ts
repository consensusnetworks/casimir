import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { DnsStackProps } from './DnsStackProps'

export interface HostedStackProps extends DnsStackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}