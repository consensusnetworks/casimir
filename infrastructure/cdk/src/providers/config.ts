import { pascalCase } from '@casimir/string-helpers'
import { ProjectConfig } from '../interfaces/ProjectConfig'

/**
 * CDK app config
 */
export class Config implements ProjectConfig {
    /** List of required environment variables */
    public readonly requiredEnvVars = ['PROJECT', 'STAGE', 'AWS_ACCOUNT', 'AWS_REGION']
    public readonly project
    public readonly stage
    public readonly env
    public readonly rootDomain
    public readonly subdomains
    public readonly nodesIp
    constructor() {
        this.checkEnvVars()
        this.project = pascalCase(process.env.PROJECT as string)
        this.stage = pascalCase(process.env.STAGE as string)
        this.env = {
            account: process.env.AWS_ACCOUNT as string,
            region: process.env.AWS_REGION as string
        }
        this.rootDomain = `${this.stage === 'Prod' ? '' : `${this.stage.toLowerCase()}.`}casimir.co`
        this.subdomains = {
            nodes: 'nodes',
            landing: 'www',
            users: 'users',
            wildcard: '*'
        }
        this.nodesIp = process.env.NODES_IP as string
    }

    /**
     * Check for required environment variables
     * @throws {Error} If any required environment variables are missing
     */
    checkEnvVars(): void {
        this.requiredEnvVars.forEach(v => {
            if (!process.env[v]) {
                console.log('No value provided for', v)
                process.exit(1)
            }
        })
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
        return this.project + pascalCase(stackName) + this.stage
    }

    /**
     * Get stack resource name with project prefix and stage suffix
     * @param stackName Stack name
     * @param resourceName Resource name
     * @returns Resource name
     * @example
     * ```typescript
     * const resourceName = config.getFullStackResourceName('etl', 'event-bucket')
     * console.log(resourceName) // EtlEventBucketDev
     * ```
     */
    getFullStackResourceName(stackName: string, resourceName: string): string {
        return this.project + pascalCase(stackName) + pascalCase(resourceName) + this.stage
    }

}