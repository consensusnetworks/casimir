import * as ecs from 'aws-cdk-lib/aws-ecs'
import { HostedStackProps } from './HostedStackProps'

export interface UsersStackProps extends HostedStackProps {
    /** Stage-specific ECS cluster */
    cluster: ecs.Cluster
}