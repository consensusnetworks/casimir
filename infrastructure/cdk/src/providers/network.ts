import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { NetworkStackProps } from '../interfaces/NetworkStackProps'
import { pascalCase } from '@casimir/string-helpers'

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

    const { project, stage, rootDomain, subdomains } = props

    /** Remove stage-specific subdomain */
    const absoluteRootDomain = (() => {
      if (rootDomain.split('.').length > 2) {
        return rootDomain.split('.').slice(1).join('.')
      }
      return rootDomain
    })()
    
    /** Get the hosted zone for the project domain */
    this.hostedZone = route53.HostedZone.fromLookup(this, `${project}${this.name}HostedZone${stage}`, {
      domainName: absoluteRootDomain
    }) as route53.HostedZone

    /** Create a shared certificate, VPC, and cluster for the stage for the stage */
    this.certificate = new certmgr.Certificate(this, `${project}${this.name}Cert${stage}`, {
      domainName: rootDomain,
      subjectAlternativeNames: Object.values(subdomains).map((subdomain: string) => `${subdomain}.${rootDomain}`),
      validation: certmgr.CertificateValidation.fromDns(this.hostedZone)
    })
    this.vpc = new ec2.Vpc(this, `${project}${this.name}Vpc${stage}`)
    this.cluster = new ecs.Cluster(this, `${project}${this.name}Cluster${stage}`, {
      capacity: {
        instanceType: new ec2.InstanceType('t3.micro')
      },
      vpc: this.vpc
    })
  }
}