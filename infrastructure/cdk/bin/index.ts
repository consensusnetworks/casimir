#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { pascalCase } from '@casimir/helpers'
import { LandingStack } from '../lib/landing/landing-stack'
import { AuthStack } from '../lib/auth/auth-stack'
import { DnsStack } from '../lib/dns/dns-stack'
import { EtlStack } from '../lib/etl/etl-stack'

const defaultEnv = { account: '257202027633', region: 'us-east-2' }

if (!process.env.PROJECT || !process.env.STAGE) {
    console.log('Please specify a project and stage for this CDK stack')
} else {
    const project = pascalCase(process.env.PROJECT)
    const stage = pascalCase(process.env.STAGE)

    const app = new cdk.App()
    const dnsStack = new DnsStack(app, `${project}DnsStack${stage}`, { env: defaultEnv, project, stage })
    const { domain, dnsRecords, hostedZone } = dnsStack
    new EtlStack(app, `${project}EtlStack${stage}`, { env: defaultEnv, project, stage })
    new AuthStack(app, `${project}AuthStack${stage}`, { env: defaultEnv, project, stage, domain, dnsRecords, hostedZone })
    new LandingStack(app, `${project}LandingStack${stage}`, { env: defaultEnv, project, stage, domain, dnsRecords, hostedZone })
}
