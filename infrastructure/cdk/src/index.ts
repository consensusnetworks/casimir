import * as cdk from "aws-cdk-lib"
import { Config } from "./providers/config"
import { UsersStack } from "./providers/users"
import { NetworkStack } from "./providers/network"
import { AnalyticsStack } from "./providers/analytics"
import { LandingStack } from "./providers/landing"
import { NodesStack } from "./providers/nodes"
import { DnsStack } from "./providers/dns"
import { WebStack } from "./providers/web"
import { DocsStack } from "./providers/docs"

const config = new Config()
const { env, stage } = config
const app = new cdk.App()

const { hostedZone, certificate } = new DnsStack(app, config.getFullStackName("dns"), { env })
const { vpc } = new NetworkStack(app, config.getFullStackName("network"), { env })

if (stage !== "prod") {
  new AnalyticsStack(app, config.getFullStackName("analytics"), { env })
  new UsersStack(app, config.getFullStackName("users"), { env, certificate, hostedZone, vpc })
  new WebStack(app, config.getFullStackName("web"), { env, certificate, hostedZone })
} else {
  new DocsStack(app, config.getFullStackName("docs"), { env, certificate, hostedZone })
  new NodesStack(app, config.getFullStackName("nodes"), { env, hostedZone })
  new LandingStack(app, config.getFullStackName("landing"), { env, certificate, hostedZone })
}
