import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { DnsStackProps } from '../interfaces/DnsStackProps'
import { pascalCase } from '@casimir/string-helpers'
import { Subdomains } from '../interfaces/Subdomains'

/**
 * Route53 DNS stack
 */
export class DnsStack extends cdk.Stack {
  /** Stack name */
  public readonly service = pascalCase('dns')
  /** Root domain */
  public readonly domain = 'casimir.co'
  /** Subdomains */
  public readonly subdomains: Subdomains = {
    landing: 'www',
    nodes: 'nodes',
    users: 'users',
    wildcard: '*'
  }
  /** Route53 hosted zone */
  public readonly hostedZone: route53.HostedZone

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props)

    const { project, stage } = props
    
    this.hostedZone = route53.HostedZone.fromLookup(this, `${project}${this.service}HostedZone${stage}`, {
      domainName: this.domain,
    }) as route53.HostedZone
  }
}