import { getSecret, loadCredentials } from '@casimir/helpers'
import { $, echo } from 'zx'

/**
 * Test a CDK app built for a CF cluster
 * 
 * Further information:
 * See https://docs.aws.amazon.com/cdk/api/v2
 */
void async function () {
    /** Configure the environment with fallback default values */
    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'dev'
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2'

    /** Get AWS secrets */
    await loadCredentials()
    process.env.AWS_ACCOUNT = await getSecret('casimir-aws-account')

    /** Set public environment variables */
    process.env.PUBLIC_USERS_URL = `https://users.${process.env.STAGE}.casimir.co`
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')

    /** Prepare CDK resources */
    await $`npm run build --workspace @casimir/landing`
    await $`npm run build --workspace @casimir/users`
    await $`npm run build --workspace @casimir/web`

    /** Test CDK app */
    echo('🚀 Testing CDK app')
    $`npm run test --workspace @casimir/cdk`
}()