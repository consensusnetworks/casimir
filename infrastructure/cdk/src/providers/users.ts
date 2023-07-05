import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { UsersStackProps } from '../interfaces/StackProps'
import { Config } from './config'
import { kebabCase } from '@casimir/helpers'

/**
 * Users API stack
 */
export class UsersStack extends cdk.Stack {
    /** Stack name */
    public readonly name = 'users'
    /** Path to stack build assets or Dockerfile */
    public readonly assetPath = 'services/users/Dockerfile'
    /** Path to stack build context */
    public readonly contextPath = '../../'

    constructor(scope: Construct, id: string, props: UsersStackProps) {
        super(scope, id, props)

        const config = new Config()
        const { project, stage, rootDomain, subdomains } = config
        const { certificate, hostedZone, vpc } = props

        /** Build users service image */
        const imageAsset = new ecrAssets.DockerImageAsset(this, config.getFullStackResourceName(this.name, 'image'), {
            directory: this.contextPath,
            file: this.assetPath,
            platform: ecrAssets.Platform.LINUX_AMD64,
            ignoreMode: cdk.IgnoreMode.GIT
        })

        /** Create a stage-specific ECS cluster */
        const cluster = new ecs.Cluster(this, config.getFullStackResourceName(this.name, 'cluster'), {
            vpc
        })

        /** Create a load-balanced users service */
        const usersService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, config.getFullStackResourceName(this.name, 'fargate'), {
            assignPublicIp: true,
            certificate,
            cluster,
            domainName: `${subdomains.users}.${rootDomain}`, // e.g. users.casimir.co or users.dev.casimir.co
            domainZone: hostedZone,
            taskImageOptions: {
                containerPort: 4000,
                image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
                environment: {
                    PROJECT: project,
                    STAGE: stage
                }
            }
        })

        /** Override the default health check path */
        usersService.targetGroup.configureHealthCheck({
            path: '/health'
        })

        /** Create DB credentials */
        const dbCredentials = new secretsmanager.Secret(this, config.getFullStackResourceName(this.name, 'db-credentials'), {
            secretName: kebabCase(config.getFullStackResourceName(this.name, 'db-credentials')),
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: 'postgres'
                }),
                generateStringKey: 'password',
                passwordLength: 30,
                excludePunctuation: true
            }
        })

        /** Grant users service access to DB credentials */
        dbCredentials.grantRead(usersService.taskDefinition.taskRole)

        /** Create a DB security group */
        const dbSecurityGroup = new ec2.SecurityGroup(this, config.getFullStackResourceName(this.name, 'db-security-group'), {
            vpc,
            allowAllOutbound: true
        })

        /** Allow inbound traffic to DB security group */
        dbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5432))

        /** Create a DB cluster */
        const dbCluster = new rds.DatabaseCluster(this, config.getFullStackResourceName(this.name, 'db-cluster'), {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_15_2
            }),
            credentials: rds.Credentials.fromSecret(dbCredentials),
            defaultDatabaseName: this.name,
            instances: 1,
            instanceProps: {
                instanceType: new ec2.InstanceType('serverless'),
                publiclyAccessible: true,
                securityGroups: [dbSecurityGroup],
                vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PUBLIC
                }
            },
            port: 5432
        })

        /** Add DB cluster autoscaling */
        cdk.Aspects.of(dbCluster).add({
            visit(node) {
                if (node instanceof rds.CfnDBCluster) {
                    node.serverlessV2ScalingConfiguration = {
                        minCapacity: 0.5,
                        maxCapacity: 1
                    }
                }
            }
        })
    }
}