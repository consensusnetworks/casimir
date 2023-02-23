import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { NetworkStackProps } from '../interfaces/StackProps'
import { pascalCase } from '@casimir/string-helpers'
import { Config } from './config'

/**
 * Route53 network stack
 */
export class NetworkStack extends cdk.Stack {
  /** Stack name */
  public readonly name = pascalCase('network')
  /** Project-wide route53 hosted zone */
  public readonly hostedZone: route53.HostedZone
  /** Stage-specific certificate */
  public readonly certificate: certmgr.Certificate
  /** Stage-specific Ec2 VPC */
  public readonly vpc: ec2.Vpc
  /** Stage-specific ECS cluster */
  public readonly cluster: ecs.Cluster


  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props)

    const config = new Config()
    const { rootDomain, subdomains, env } = config

    /** Remove stage-specific subdomain */
    const absoluteRootDomain = (() => {
      if (rootDomain.split('.').length > 2) {
        return rootDomain.split('.').slice(1).join('.')
      }
      return rootDomain
    })()
    
    /** Get the hosted zone for the project domain */
    this.hostedZone = route53.HostedZone.fromLookup(this, config.getFullStackResourceName(this.name, 'hosted-zone'), {
      domainName: absoluteRootDomain
    }) as route53.HostedZone

    /** Create a stage-specific Ec2 VPC and ECS cluster */
    this.vpc = new ec2.Vpc(this, config.getFullStackResourceName(this.name, 'vpc'))
    this.cluster = new ecs.Cluster(this, config.getFullStackResourceName(this.name, 'cluster'), { vpc: this.vpc })

    /** Create a stage-specific SSL certificate */
    this.certificate = new certmgr.DnsValidatedCertificate(this, config.getFullStackResourceName(this.name, 'cert'), {
      domainName: rootDomain,
      subjectAlternativeNames: [`${subdomains.wildcard}.${rootDomain}`],
      hostedZone: this.hostedZone,
      region: env.region
    })
  }
}