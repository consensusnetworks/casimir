import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { NodesStackProps } from '../interfaces/NodesStackProps'
import { pascalCase } from '@casimir/string-helpers'

/**
 * Cryptonodes stack
 */
export class NodesStack extends cdk.Stack {
    /** Stack name */
    public readonly name = pascalCase('nodes')

    constructor(scope: Construct, id: string, props: NodesStackProps) {
        super(scope, id, props)

        const { project, stage, rootDomain, subdomains, hostedZone, nodesIp } = props

        /** Create an A record for the nodes web server IP */
        new route53.ARecord(this, `${project}${this.name}DnsARecordApi${stage}`, {
            recordName: `${subdomains.nodes}.${rootDomain}`,
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromIpAddresses(nodesIp),
            ttl: cdk.Duration.minutes(1),
        })
    }
}