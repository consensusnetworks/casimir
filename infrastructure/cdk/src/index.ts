import * as cdk from "aws-cdk-lib"
import { Config } from "./providers/config"
import { AnalyticsStack } from "./providers/analytics"
import { BlogStack } from "./providers/blog"
import { DocsStack } from "./providers/docs"
import { DnsStack } from "./providers/dns"
import { LandingStack } from "./providers/landing"
import { NetworkStack } from "./providers/network"
import { NodesStack } from "./providers/nodes"
import { UsersStack } from "./providers/users"
import { WebStack } from "./providers/web"

const config = new Config()
const { env, stage } = config
const app = new cdk.App()

const { hostedZone, certificate } = new DnsStack(app, config.getFullStackName("dns"), { env })
const { vpc } = new NetworkStack(app, config.getFullStackName("network"), { env })

if (stage !== "prod") {
    new AnalyticsStack(app, config.getFullStackName("analytics"), { env })
    new BlogStack(app, config.getFullStackName("blog"), { env, certificate, hostedZone, vpc })
    new DocsStack(app, config.getFullStackName("docs"), { env, certificate, hostedZone })
    new LandingStack(app, config.getFullStackName("landing"), { env, certificate, hostedZone })
    new UsersStack(app, config.getFullStackName("users"), { env, certificate, hostedZone, vpc })
    new WebStack(app, config.getFullStackName("web"), { env, certificate, hostedZone })
} else {
    new BlogStack(app, config.getFullStackName("blog"), { env, certificate, hostedZone, vpc })
    new DocsStack(app, config.getFullStackName("docs"), { env, certificate, hostedZone })
    new LandingStack(app, config.getFullStackName("landing"), { env, certificate, hostedZone })
    new NodesStack(app, config.getFullStackName("nodes"), { env, hostedZone })
}
