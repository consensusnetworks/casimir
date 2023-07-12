import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { NetworkStackProps } from '../interfaces/StackProps'
import { pascalCase } from '@casimir/helpers'
import { Config } from './config'

/**
 * Route53 network stack
 */
export class NetworkStack extends cdk.Stack {
  /** Stack name */
  public readonly name = pascalCase('network')
  /** Stage-specific Ec2 VPC */
  public readonly vpc: ec2.Vpc

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props)

    const config = new Config()

    /** Create a stage-specific VPC */
    this.vpc = new ec2.Vpc(this, config.getFullStackResourceName(this.name, 'vpc'), {
      natGateways: 0
    })
  }
}