#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import AuthStack from './providers/auth'
import DnsStack from './providers/dns'
import EtlStack from './providers/etl'
import LandingStack from './providers/landing'
import Config from './providers/config'

const { project, stage, env } = new Config()
const app = new cdk.App()
const dnsStack = new DnsStack(app, `${project}DnsStack${stage}`, { env, project, stage })
const { domain, dnsRecords, hostedZone } = dnsStack
if (process.env.STAGE !== 'prod') {
    /** Deploy pre-production resources */
    new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
    new AuthStack(app, `${project}AuthStack${stage}`, { env, project, stage, domain, dnsRecords, hostedZone })
}
/** Deploy production-ready resources */
new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, domain, dnsRecords, hostedZone })
