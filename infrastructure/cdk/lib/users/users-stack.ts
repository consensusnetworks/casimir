import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'

export interface UsersStackProps extends StackProps {
    project: string;
    stage: string;
    domain: string;
    dnsRecords: Record<string, string>;
    hostedZone: route53.HostedZone;
    certificate: certmgr.DnsValidatedCertificate;
}

/**
 * Class representing the users stack.
 *
 * Shortest name:  {@link UsersStack}
 * Full name:      {@link (UsersStack:class)}
 */
export class UsersStack extends Stack {

    public readonly service: string = 'Users'
    public readonly assetPath: string = '../../services/users/dist'

    /**
     * UsersStack class constructor.
     * 
     * Shortest name:  {@link (UsersStack:constructor)}
     * Full name:      {@link (UsersStack:constructor)}
     */
    constructor(scope: Construct, id: string, props: UsersStackProps) {

        /**
         * UsersStack class constructor super method.
         * 
         * Shortest name:  {@link (UsersStack:constructor:super)}
         * Full name:      {@link (UsersStack:constructor:super)}
         */
        super(scope, id, props)

        const { project, stage, domain, dnsRecords, hostedZone } = props

        // Use casimir.co for prod and dev.casimir.co for dev
        const serviceDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')
    
        const certificate = new certmgr.DnsValidatedCertificate(this, `${project}${this.service}Cert${stage}`, {
            domainName: serviceDomain,
            subjectAlternativeNames: [
                [dnsRecords.users, serviceDomain].join('.')
            ],
            hostedZone,
            region: 'us-east-2'
        })

        const lambdaHandler = new lambda.Function(this, `${project}${this.service}Api${stage}`, {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(this.assetPath),
            environment: {
                PROJECT: project.toLowerCase(),
                STAGE: stage.toLowerCase()
            },
            timeout: Duration.seconds(25)
        })

        const pinpointPolicy = new iam.PolicyStatement({
            actions: ['mobiletargeting:*', 'mobileanalytics:*'],
            resources: ['*'],
        })

        lambdaHandler.role?.attachInlinePolicy(
            new iam.Policy(this, `${project}${this.service}PinpointPolicy${stage}`, {
                statements: [pinpointPolicy]
            })
        )

        // Todo update to use new api gateway version when stable
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-apigateway-readme.html#apigateway-v2
        const apiGateway = new apigateway.LambdaRestApi(this, `${project}${this.service}ApiGateway${stage}`, {
            restApiName: `${project}${this.service}UsersGateway${stage}`,
            handler: lambdaHandler,
            domainName: {
                domainName: [dnsRecords.users, serviceDomain].join('.'),
                certificate
            },
            defaultCorsPreflightOptions: {
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS
            }
        })

        new route53.ARecord(this, `${project}${this.service}DnsARecordApi${stage}`, {
            recordName: [dnsRecords.users, serviceDomain].join('.'),
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromAlias(new route53targets.ApiGateway(apiGateway)),
            ttl: Duration.minutes(1),
        })

    }
}