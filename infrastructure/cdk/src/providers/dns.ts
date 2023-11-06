import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as certmgr from "aws-cdk-lib/aws-certificatemanager"
import * as route53 from "aws-cdk-lib/aws-route53"
import { DnsStackProps } from "../interfaces/StackProps"
import { pascalCase } from "@casimir/format"
import { Config } from "./config"

/**
 * Route53 dns stack
 */
export class DnsStack extends cdk.Stack {
    public readonly name = pascalCase("dns")
    public readonly hostedZone: route53.HostedZone
    public readonly certificate: certmgr.Certificate

    constructor(scope: Construct, id: string, props: DnsStackProps) {
        super(scope, id, props)

        const config = new Config()
        const { rootDomain, subdomains } = config

        const absoluteRootDomain = (() => {
            if (rootDomain.split(".").length > 2) {
                return rootDomain.split(".").slice(1).join(".")
            }
            return rootDomain
        })()

        this.hostedZone = route53.HostedZone.fromLookup(this, config.getFullStackResourceName(this.name, "hosted-zone"), {
            domainName: absoluteRootDomain
        }) as route53.HostedZone

        this.certificate = new certmgr.Certificate(this, config.getFullStackResourceName(this.name, "cert"), {
            domainName: rootDomain,
            subjectAlternativeNames: [`${subdomains.wildcard}.${rootDomain}`],
            validation: certmgr.CertificateValidation.fromDns(this.hostedZone)
        })
    }
}