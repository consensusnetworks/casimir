import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import { BlogStackProps } from "../interfaces/StackProps"
import { Config } from "./config"
import { kebabCase, pascalCase } from "@casimir/format"

/**
 * Blog service stack
 */
export class BlogStack extends cdk.Stack {
	public readonly name = "blog"

	constructor(scope: Construct, id: string, props: BlogStackProps) {
		super(scope, id, props)

		const config = new Config()
		const { project, stage, rootDomain, subdomains } = config
		const { certificate, hostedZone, vpc } = props

		const imageAsset = new ecrAssets.DockerImageAsset(this, config.getFullStackResourceName(this.name, "image"), {
			directory: "../../",
			file: "services/blog/Dockerfile",
			platform: ecrAssets.Platform.LINUX_AMD64,
			ignoreMode: cdk.IgnoreMode.GIT
		})

		const hackmdTokenKey = "casimir-blog-hackmd-token"
		const hackmdToken = ecs.Secret.fromSecretsManager(
			secretsmanager.Secret.fromSecretNameV2(this, pascalCase(hackmdTokenKey), kebabCase(hackmdTokenKey))
		)
        
		const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, config.getFullStackResourceName(this.name, "fargate"), {
			assignPublicIp: true,
			certificate,
			domainName: `${subdomains.blog}.${rootDomain}`, // e.g. blog.casimir.co or blog.dev.casimir.co
			domainZone: hostedZone,
			taskImageOptions: {
				containerPort: 4001,
				image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
				environment: {
					PROJECT: project,
					STAGE: stage
				},
				secrets: {
					HACKMD_TOKEN: hackmdToken
				}
			},
			vpc
		})

		fargateService.targetGroup.configureHealthCheck({
			path: "/health"
		})
	}
}