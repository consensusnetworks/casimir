import { Construct } from 'constructs'
import { Duration, Stack } from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager'
import { AuthStackProps } from '../interfaces/AuthStackProps'

/**
 * Class representing the auth stack.
 *
 * Shortest name:  {@link AuthStack}
 * Full name:      {@link (AuthStack:class)}
 */
export class AuthStack extends Stack {

    public readonly service: string = 'Auth'
    public readonly assetPath: string = '../../services/auth/dist'

    /**
     * AuthStack class constructor.
     * 
     * Shortest name:  {@link (AuthStack:constructor)}
     * Full name:      {@link (AuthStack:constructor)}
     */
    constructor(scope: Construct, id: string, props: AuthStackProps) {

        /**
         * AuthStack class constructor super method.
         * 
         * Shortest name:  {@link (AuthStack:constructor:super)}
         * Full name:      {@link (AuthStack:constructor:super)}
         */
        super(scope, id, props)

        const { project, stage, domain, dnsRecords, hostedZone } = props

        // Use casimir.co for prod and dev.casimir.co for dev
        const serviceDomain = stage === 'Prod' ? domain : [stage.toLowerCase(), domain].join('.')
    
        const certificate = new certmgr.Certificate(this, `${project}${this.service}Cert${stage}`, {
            domainName: serviceDomain,
            subjectAlternativeNames: [
                [dnsRecords.auth, serviceDomain].join('.')
            ],
            validation: certmgr.CertificateValidation.fromDns(hostedZone)
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

        // Todo update to use new api gateway version when stable
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-apigateway-readme.html#apigateway-v2
        const apiGateway = new apigateway.LambdaRestApi(this, `${project}${this.service}ApiGateway${stage}`, {
            restApiName: `${project}${this.service}Gateway${stage}`,
            handler: lambdaHandler,
            domainName: {
                domainName: [dnsRecords.auth, serviceDomain].join('.'),
                certificate
            },
            defaultCorsPreflightOptions: {
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS
            }
        })

        new route53.ARecord(this, `${project}${this.service}DnsARecordApi${stage}`, {
            recordName: [dnsRecords.auth, serviceDomain].join('.'),
            zone: hostedZone as route53.IHostedZone,
            target: route53.RecordTarget.fromAlias(new route53targets.ApiGateway(apiGateway)),
            ttl: Duration.minutes(1),
        })

    }
}