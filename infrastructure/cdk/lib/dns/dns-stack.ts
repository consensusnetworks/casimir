import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as route53 from 'aws-cdk-lib/aws-route53'

export interface DnsStackProps extends StackProps {
  project: string;
  stage: string;
}

/**
 * Class representing the website stack.
 *
 * Shortest name:  {@link DnsStack}
 * Full name:      {@link (DnsStack:class)}
 */
export class DnsStack extends Stack {

  public readonly service: string = 'Dns'
  public readonly domain: string
  public readonly dnsRecords: Record<string, string>
  public readonly hostedZone: route53.HostedZone

  /**
   * DnsStack class constructor.
   * 
   * Shortest name:  {@link (DnsStack:constructor)}
   * Full name:      {@link (DnsStack:constructor)}
   */
  constructor(scope: Construct, id: string, props: DnsStackProps) {

    /**
     * DnsStack class constructor super method.
     * 
     * Shortest name:  {@link (DnsStack:constructor:super)}
     * Full name:      {@link (DnsStack:constructor:super)}
     */
    super(scope, id, props)

    const { project, stage } = props

    const domain = 'casimir.co'
    
    const dnsRecords = {
        wildcard: '*',
        website: 'www',
        users: 'users'
    }

    const hostedZone = route53.HostedZone.fromLookup(this, `${project}${this.service}HostedZone${stage}`, {
      domainName: domain,
    }) as route53.HostedZone

    this.domain = domain
    this.dnsRecords = dnsRecords
    this.hostedZone = hostedZone

  }
}