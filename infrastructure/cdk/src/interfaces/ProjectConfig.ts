export interface ProjectConfig {
    env: {
        account: string
        region: string
    } 
    project: string
    stage: string
    rootDomain: string
    subdomains: {
        docsEthereum: string
        landing: string
        nodes: string
        users: string
        web: string
        wildcard: string
    }
}