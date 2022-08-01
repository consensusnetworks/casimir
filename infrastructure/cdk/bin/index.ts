#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { pascalCase } from '@casimir/helpers'
import { WebsiteStack } from '../lib/website/website-stack'
import { UsersStack } from '../lib/users/users-stack'
import { DnsStack } from '../lib/dns/dns-stack'
import { EtlStack } from '../lib/etl/etl-stack'

if (!process.env.PROJECT || !process.env.STAGE) {
    console.log('Please specify a project and stage for this CDK stack')
} else {
    const project = pascalCase(process.env.PROJECT)
    const stage = pascalCase(process.env.STAGE)

    const app = new cdk.App()
    const dnsStack = new DnsStack(app, `${project}DnsStack${stage}`, { project, stage })
    const { domain, dnsRecords, hostedZone } = dnsStack
    new EtlStack(app, `${project}EtlStack${stage}`, { project, stage })
    new UsersStack(app, `${project}UsersStack${stage}`, { project, stage, domain, dnsRecords, hostedZone })
    new WebsiteStack(app, `${project}WebsiteStack${stage}`, { project, stage, domain, dnsRecords, hostedZone })
}
