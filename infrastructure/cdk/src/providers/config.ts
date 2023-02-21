import { pascalCase } from '@casimir/string-helpers'
import { StackProps } from '../interfaces/StackProps'

/**
 * CDK app config
 */
export class Config implements StackProps {
    /** List of required environment variables */
    readonly requiredEnvVars = ['PROJECT', 'STAGE', 'AWS_ACCOUNT', 'AWS_REGION']
    readonly project
    readonly stage
    readonly env
    readonly rootDomain
    readonly subdomains
    readonly nodesIp
    constructor() {
        this.requiredEnvVars.forEach(v => {
            if (!process.env[v]) {
                console.log('No value provided for', v)
                process.exit(1)
            }
        })
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
     * Get stack name with project prefix and stage suffix
     * @param stackName Stack name
     * @returns Full stack name
     * @example
     * ```typescript
     * const stackName = config.getFullStackName('etl')
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
     * ```
     */
    getFullStackResourceName(stackName: string, resourceName: string): string {
        return this.project + pascalCase(stackName) + pascalCase(resourceName) + this.stage
    }

}