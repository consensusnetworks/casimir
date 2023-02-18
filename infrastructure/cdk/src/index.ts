import * as cdk from 'aws-cdk-lib'
import { Config } from './providers/config'
import { UsersStack } from './providers/users'
import { DnsStack } from './providers/dns'
import { EtlStack } from './providers/etl'
import { LandingStack } from './providers/landing'
import { NodesStack } from './providers/nodes'

const { project, stage, env, nodesIp } = new Config()
const app = new cdk.App()
const { domain, subdomains, hostedZone } = new DnsStack(app, `${project}DnsStack${stage}`, { env, project, stage })

/** Create development-only resources */
if (process.env.STAGE !== 'prod') {
    new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
    new UsersStack(app, `${project}UsersStack${stage}`, { env, project, stage, domain, subdomains, hostedZone })
}
/** Create production-only resources */
if (process.env.STAGE === 'prod') {
    new NodesStack(app, `${project}NodesStack${stage}`, { env, project, stage, domain, subdomains, hostedZone, nodesIp })
}
/** Create remaining resources */
new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, domain, subdomains, hostedZone })
