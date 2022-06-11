import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'

/**
 * Class representing the users stack.
 *
 * Shortest name:  {@link UsersStack}
 * Full name:      {@link (UsersStack:class)}
 */
export class UsersStack extends Stack {

    /**
     * UsersStack class constructor.
     * 
     * Shortest name:  {@link (UsersStack:constructor)}
     * Full name:      {@link (UsersStack:constructor)}
     */
    constructor(scope: Construct, id: string, props?: StackProps) {

        /**
         * UsersStack class constructor super method.
         * 
         * Shortest name:  {@link (UsersStack:constructor:super)}
         * Full name:      {@link (UsersStack:constructor:super)}
         */
        super(scope, id, props)

        const project = process.env.PROJECT?.replace(/\b\w/g, c => c.toUpperCase())
        const stage = process.env.STAGE?.replace(/\b\w/g, c => c.toUpperCase())
        const service = 'Users'

        const lambdaHandler = new lambda.Function(this, `${project}${service}Api${stage}`, {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../../services/users/dist'),
            environment: {
                PROJECT: process.env.PROJECT as string,
                STAGE: process.env.STAGE as string
            },
            timeout: Duration.seconds(25)
        })

        const pinpointPolicy = new iam.PolicyStatement({
            actions: ['mobiletargeting:*', 'mobileanalytics:*'],
            resources: ['*'],
        })

        lambdaHandler.role?.attachInlinePolicy(
            new iam.Policy(this, `${project}${service}PinpointPolicy${stage}`, {
                statements: [pinpointPolicy]
            })
        )

        // Todo update to use new api gateway version when stable
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-apigateway-readme.html#apigateway-v2
        new apigateway.LambdaRestApi(this, `${project}${service}ApiGateway${stage}`, {
            restApiName: `${project}${service}UsersApiGateway${stage}`,
            handler: lambdaHandler,
            defaultCorsPreflightOptions: {
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS
            }
        })

    }
}