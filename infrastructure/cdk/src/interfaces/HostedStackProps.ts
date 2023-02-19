import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { NetworkStackProps } from './NetworkStackProps'

export interface HostedStackProps extends NetworkStackProps {
    /** Project-wide route53 hosted zone */
    hostedZone: route53.HostedZone
    /** Stage-specific certificate */
    certificate?: certmgr.Certificate
}