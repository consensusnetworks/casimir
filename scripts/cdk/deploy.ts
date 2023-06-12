import { getSecret, loadCredentials } from '@casimir/helpers'
import { $, echo } from 'zx'

/**
 * Deploy a CDK app to a CF cluster
 * 
 * Further information:
 * See https://docs.aws.amazon.com/cdk/api/v2
 */
void async function () {
    /** Get AWS secrets */
    await loadCredentials()
    process.env.AWS_ACCOUNT = await getSecret('casimir-aws-account')
    process.env.NODES_IP = await getSecret('casimir-nodes-ip')

    /** Prepare CDK resources */
    await $`npm run build --workspace @casimir/landing`
    await $`npm run build --workspace @casimir/users`

    /** Prepare CDK app */
    await $`npm run bootstrap --workspace @casimir/cdk`
    await $`npm run synth --workspace @casimir/cdk`

    /** Deploy CDK app to AWS */
    echo('🚀 Deploying CDK app')
    $`npm run deploy --workspace @casimir/cdk`
}()





