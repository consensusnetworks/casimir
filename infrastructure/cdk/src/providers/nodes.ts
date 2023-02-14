import { Construct } from 'constructs'
import { Duration, Stack } from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { NodesStackProps } from '../interfaces/NodesStackProps'

/**
 * Class representing the nodes stack.
 *
 * Shortest name:  {@link NodesStack}
 * Full name:      {@link (NodesStack:class)}
 */
export default class NodesStack extends Stack {

    public readonly service: string = 'Nodes'
    public readonly assetPath: string = '../../services/nodes/dist'

    /**
     * NodesStack class constructor.
     * 
     * Shortest name:  {@link (NodesStack:constructor)}
     * Full name:      {@link (NodesStack:constructor)}
     */
    constructor(scope: Construct, id: string, props: NodesStackProps) {

        /**
         * NodesStack class constructor super method.
         * 
         * Shortest name:  {@link (NodesStack:constructor:super)}
         * Full name:      {@link (NodesStack:constructor:super)}
         */
        super(scope, id, props)

        const { project, stage, domain, dnsRecords, hostedZone, nodesIp } = props

        // Use casimir.co for prod and dev.casimir.co for dev
        const serviceDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')

        new route53.ARecord(this, `${project}${this.service}DnsARecordApi${stage}`, {
            recordName: [dnsRecords.nodes, serviceDomain].join('.'),
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromIpAddresses(nodesIp),
            ttl: Duration.minutes(1),
        })

    }
}