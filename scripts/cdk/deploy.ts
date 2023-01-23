import { $, echo } from 'zx'

/**
 * Deploy a CDK app to a CF cluster
 * 
 * Further information:
 * See https://docs.aws.amazon.com/cdk/api/v2
 */
void async function () {
    /** Prepare the CDK app */
    await $`npm run bootstrap --workspace @core/cdk`
    await $`npm run synth --workspace @core/cdk`

    /** Deploy the CDK app to AWS */
    echo('🚀 Deploying CDK app')
    $`npm run deploy --workspace @core/cdk`
}()





