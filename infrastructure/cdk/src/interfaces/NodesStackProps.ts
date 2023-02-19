import { HostedStackProps } from './HostedStackProps'

export interface NodesStackProps extends HostedStackProps {
    /** Nodes IP address */
    nodesIp: string
}