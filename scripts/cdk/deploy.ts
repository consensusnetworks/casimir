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

    process.env.PUBLIC_MANAGER_ADDRESS = '0x5d35a44Db8a390aCfa997C9a9Ba3a2F878595630'
    process.env.PUBLIC_VIEWS_ADDRESS = '0xC88C4022347305336E344e624E5Fa4fB8e61c21E'
    process.env.PUBLIC_REGISTRY_ADDRESS = '0xB567C0E87Ec176177E44C91577704267C24Fbd83'
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')
    process.env.PUBLIC_WALLET_CONNECT_PROJECT_ID = await getSecret('casimir-wallet-connect-project-id')
    
    await run('npm run build --workspace @casimir/ethereum')
    await run('npm run build:docs --workspace @casimir/ethereum')
    await run('npm run build --workspace @casimir/landing')
    await run('npm run build --workspace @casimir/users')
    await run('npm run build --workspace @casimir/web')

    await run('npm run bootstrap --workspace @casimir/cdk')
    await run('npm run synth --workspace @casimir/cdk')

    console.log('🚀 Deploying CDK app')
    await run('npm run deploy --workspace @casimir/cdk')
}()





