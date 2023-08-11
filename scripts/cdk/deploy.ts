import { getSecret, loadCredentials } from '@casimir/aws'
import { run } from '@casimir/helpers'

/**
 * Deploy CDK stacks
 */
void async function () {
    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'dev'
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2'
    
    await loadCredentials()
    process.env.AWS_ACCOUNT = await getSecret('casimir-aws-account')

    process.env.ETHEREUM_RPC_URL = 'https://nodes.casimir.co/eth/hardhat'
    process.env.USERS_URL = `https://users.${process.env.STAGE}.casimir.co`

    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')

    await run('npm run build --workspace @casimir/landing')
    await run('npm run build --workspace @casimir/web')

    await run('npm run bootstrap --workspace @casimir/cdk')
    await run('npm run synth --workspace @casimir/cdk')

    console.log('🚀 Deploying CDK app')
    await run('npm run deploy --workspace @casimir/cdk')
}()





