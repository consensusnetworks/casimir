import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'

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
                STAGE: process.env.STAGE as string,
                AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
                AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string
            }
        })

        // Todo update to use new api gateway version when stable
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-apigateway-readme.html#apigateway-v2
        new apigateway.LambdaRestApi(this, `${project}${service}ApiGateway${stage}`, {
            restApiName: `${project}${service}UsersApiGateway${stage}`,
            handler: lambdaHandler,
            // Todo restrict cors
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS
            }
        })

    }
}