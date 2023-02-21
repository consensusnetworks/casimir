import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { NodesStackProps } from '../interfaces/StackProps'
import { pascalCase } from '@casimir/string-helpers'
import { Config } from './config'

/**
 * Cryptonodes stack
 */
export class NodesStack extends cdk.Stack {
    /** Stack name */
    public readonly name = pascalCase('nodes')

    constructor(scope: Construct, id: string, props: NodesStackProps) {
        super(scope, id, props)

        const { rootDomain, subdomains, hostedZone, nodesIp } = props
        const config = new Config()

        /** Create an A record for the nodes web server IP */
        new route53.ARecord(this, config.getFullStackResourceName(this.name, 'a-record-api'), {
            recordName: `${subdomains.nodes}.${rootDomain}`,
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromIpAddresses(nodesIp),
            ttl: cdk.Duration.minutes(1),
        })
    }
}