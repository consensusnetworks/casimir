import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as rds from 'aws-cdk-lib/aws-rds'
import { UsersStackProps } from '../interfaces/StackProps'
import { Config } from './config'

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
        const { certificate, cluster, hostedZone, vpc } = props

        /** Create a security group for Aurora DB */
        const dbSecurityGroup = new ec2.SecurityGroup(this, config.getFullStackResourceName(this.name, 'db-group'), {
            vpc: vpc,
            allowAllOutbound: true
        })

        /** Allow inbound traffic from anywhere to the DB */
        dbSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(5432),
            'Allow inbound traffic from anywhere to the DB on port 5432'
        )

        /** Create a DB cluster */
        const dbCluster = new rds.DatabaseCluster(this, config.getFullStackResourceName(this.name, 'db-cluster'), {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_13_6,
            }),
            instances: 1,
            instanceProps: {
                vpc: vpc,
                instanceType: new ec2.InstanceType('serverless'),
                autoMinorVersionUpgrade: true,
                publiclyAccessible: true,
                securityGroups: [dbSecurityGroup],
                vpcSubnets: vpc.selectSubnets({
                    subnetType: ec2.SubnetType.PUBLIC
                })
            },
            port: 5432
        })

        /** Add capacity to the DB cluster to enable scaling */
        cdk.Aspects.of(dbCluster).add({
            visit(node) {
                if (node instanceof rds.CfnDBCluster) {
                    node.serverlessV2ScalingConfiguration = {
                        minCapacity: 0.5,
                        maxCapacity: 1
                    }
                }
            },
        })

        /** Build users service image */
        const imageAsset = new ecrAssets.DockerImageAsset(this, config.getFullStackResourceName(this.name, 'image'), {
            directory: this.contextPath,
            file: this.assetPath,
            platform: ecrAssets.Platform.LINUX_AMD64,
            ignoreMode: cdk.IgnoreMode.GIT
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
                    STAGE: stage,
                    DB_SECRET_ARN: dbCluster.secret?.secretArn || ''
                }
            }
        })

        /** Override the default health check path */
        usersService.targetGroup.configureHealthCheck({
            path: '/health'
        })
    }
}