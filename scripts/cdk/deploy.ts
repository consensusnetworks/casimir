import { getSecret, loadCredentials } from '@casimir/aws'
import { $, echo } from 'zx'

/**
 * Deploy a CDK app to a CF cluster
 * 
 * Further information:
 * See https://docs.aws.amazon.com/cdk/api/v2
 */
void async function () {
    /** Configure the environment with fallback default values */
    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'dev'
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2'

    /** Set default values for contracts addresses */
    process.env.PUBLIC_MANAGER_ADDRESS = '0x5d35a44Db8a390aCfa997C9a9Ba3a2F878595630'
    process.env.PUBLIC_VIEWS_ADDRESS = '0xC88C4022347305336E344e624E5Fa4fB8e61c21E'
    process.env.PUBLIC_REGISTRY_ADDRESS = '0xB567C0E87Ec176177E44C91577704267C24Fbd83'
    
    /** Get AWS credentials */
    await loadCredentials()
    process.env.AWS_ACCOUNT = await getSecret('casimir-aws-account')

    /** Set private environment variables */
    process.env.ETHEREUM_RPC_URL = 'https://nodes.casimir.co/eth/hardhat'
    process.env.USERS_URL = `https://users.${process.env.STAGE}.casimir.co`

    /** Set public environment variables */
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')

    /** Prepare CDK resources */
    await $`npm run build --workspace @casimir/landing`
    await $`npm run build --workspace @casimir/web`

    /** Prepare CDK app */
    await $`npm run bootstrap --workspace @casimir/cdk`
    await $`npm run synth --workspace @casimir/cdk`

    /** Deploy CDK app to AWS */
    echo('🚀 Deploying CDK app')
    $`npm run deploy --workspace @casimir/cdk`
}()





