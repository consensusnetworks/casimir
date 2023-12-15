import { pascalCase } from "@casimir/format"
import { ProjectConfig } from "../interfaces/ProjectConfig"
import dataPackage from "@casimir/data/package.json"

/**
 * CDK app config
 */
export class Config implements ProjectConfig {
    public readonly project
    public readonly stage
    public readonly env
    public readonly rootDomain
    public readonly subdomains
    public readonly dataVersion

    public readonly requiredEnvVars = [
        "PROJECT",
        "STAGE",
        "AWS_ACCOUNT",
        "AWS_REGION"
    ]

    constructor() {
        this.requiredEnvVars.forEach(v => {
            if (!process.env[v]) {
                throw new Error(`No environment variable set for ${v}`)
            }
        })
        this.project = process.env.PROJECT as string
        this.stage = process.env.STAGE as string
        this.env = {
            account: process.env.AWS_ACCOUNT as string,
            region: process.env.AWS_REGION as string
        }
        this.rootDomain = `${this.stage === "prod" ? "" : `${this.stage}.`}casimir.co`
        this.subdomains = {
            blog: "blog",
            docs: "docs",
            nodes: "nodes",
            landing: "www",
            users: "users",
            web: "app",
            wildcard: "*"
        }
        this.dataVersion = Number(dataPackage.version.split(".")[0])
    }

    /**
     * Get stack name with project prefix and stage suffix
     * @param stackName Stack name
     * @returns Full stack name
     * @example
     * ```typescript
     * const stackName = config.getFullStackName('etl')
     * console.log(stackName) // EtlDev
     * ```
     */
    getFullStackName(stackName: string): string {
        return pascalCase(this.project) + pascalCase(stackName) + pascalCase(this.stage)
    }

    /**
     * Get stack resource name with project prefix and stage suffix
     * @param stackName Stack name
     * @param resourceName Resource name
     * @param version Optional resource version
     * @returns Resource name
     * @example
     * ```typescript
     * const resourceName = config.getFullStackResourceName('etl', 'event-bucket')
     * console.log(resourceName) // CasimirEtlEventBucketDev
     * ```
     */
    getFullStackResourceName(stackName: string, resourceName: string, version?: number): string {
        const name = 
            pascalCase(this.project) + pascalCase(stackName) + pascalCase(resourceName) + pascalCase(this.stage)
        if (version) {
            return name + version
        }
        return name
    }
}