import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import { NodesStackProps } from "../interfaces/StackProps"
import { kebabCase, pascalCase } from "@casimir/format"
import { Config } from "./config"

/**
 * Public node stack
 */
export class NodesStack extends cdk.Stack {
  public readonly name = pascalCase("nodes")

  constructor(scope: Construct, id: string, props: NodesStackProps) {
    super(scope, id, props)

    const config = new Config()
    const { rootDomain, subdomains } = config
    const { hostedZone } = props

    const nodesIp = secretsmanager.Secret.fromSecretNameV2(this, config.getFullStackResourceName(this.name, "nodes-ip"), kebabCase(config.getFullStackResourceName(this.name, "nodes-ip")))

    new route53.ARecord(this, config.getFullStackResourceName(this.name, "a-record-api"), {
      recordName: `${subdomains.nodes}.${rootDomain}`,
      zone: hostedZone as route53.IHostedZone,
      target: route53.RecordTarget.fromIpAddresses(nodesIp.secretValue.unsafeUnwrap()),
      ttl: cdk.Duration.minutes(1),
    })
  }
}