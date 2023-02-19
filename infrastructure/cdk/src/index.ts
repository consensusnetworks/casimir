import * as cdk from 'aws-cdk-lib'
import { Config } from './providers/config'
import { UsersStack } from './providers/users'
import { NetworkStack } from './providers/network'
import { EtlStack } from './providers/etl'
import { LandingStack } from './providers/landing'
import { NodesStack } from './providers/nodes'

/** Create CDK app and stacks */
const { project, stage, env, nodesIp, rootDomain, subdomains } = new Config()
const app = new cdk.App()
const { hostedZone, certificate, cluster } = new NetworkStack(app, `${project}NetworkStack${stage}`, { env, project, stage, rootDomain, subdomains })
if (process.env.STAGE !== 'prod') {
    /** Create development-only stacks */
    new EtlStack(app, `${project}EtlStack${stage}`, { env, project, stage })
    new UsersStack(app, `${project}UsersStack${stage}`, { env, project, stage, rootDomain, subdomains, hostedZone, certificate, cluster })
} else {
    /** Create production-only stacks */
    new NodesStack(app, `${project}NodesStack${stage}`, { env, project, stage, rootDomain, subdomains, hostedZone, certificate, nodesIp })
}
/** Create remaining stacks */
new LandingStack(app, `${project}LandingStack${stage}`, { env, project, stage, rootDomain, subdomains, hostedZone })
