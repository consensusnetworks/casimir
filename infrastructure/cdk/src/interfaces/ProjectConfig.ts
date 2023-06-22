export interface ProjectConfig {
    /** Deployment AWS env */
    env: {
        /** AWS account number */
        account: string
        /** AWS region */
        region: string
    } 
    /** Project name */
    project: string
    /** Stage name */
    stage: string
    /** Stage-specific root domain (i.e., casimir.co for prod, dev.casimir.co for dev) */
    rootDomain: string
    /** Stage-specific subdomains (i.e., api.casimir.co for prod, api.dev.casimir.co for dev) */
    subdomains: {
        landing: string
        nodes: string
        users: string
        web: string
        wildcard: string
    }
    /** Nodes IP address */
    nodesIp: string
}