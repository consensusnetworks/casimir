import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { NetworkStackProps } from "../interfaces/StackProps"
import { pascalCase } from "@casimir/format"
import { Config } from "./config"

/**
 * VPC network stack
 */
export class NetworkStack extends cdk.Stack {
    public readonly name = pascalCase("network")
    public readonly vpc: ec2.Vpc

    constructor(scope: Construct, id: string, props: NetworkStackProps) {
        super(scope, id, props)

        const config = new Config()

        this.vpc = new ec2.Vpc(this, config.getFullStackResourceName(this.name, "vpc"), {
            natGateways: 0
        })
    }
}