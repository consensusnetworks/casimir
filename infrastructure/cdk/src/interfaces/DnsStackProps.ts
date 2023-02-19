import { StackProps } from './StackProps'

export interface DnsStackProps extends StackProps {
    /** Stage-specific root domain (i.e., casimir.co for prod, dev.casimir.co for dev) */
    rootDomain: string 
    /** Stage-specific subdomains (i.e., api.casimir.co for prod, api.dev.casimir.co for dev) */
    subdomains: {
        nodes: string
        landing: string
        users: string    
        wildcard: string
    }
}