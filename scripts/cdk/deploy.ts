import { getSecret, loadCredentials } from '@casimir/aws'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'
import { run } from '@casimir/shell'

/**
 * Deploy CDK stacks
 */
void async function () {
    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'dev'
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2'
    
    await loadCredentials()
    process.env.AWS_ACCOUNT = await getSecret('casimir-aws-account')

    process.env.BLOG_URL = process.env.STAGE === 'prod' ? 'https://blog.casimir.co' : `https://blog.${process.env.STAGE}.casimir.co`
    process.env.DOCS_URL = process.env.STAGE === 'prod' ? 'https://docs.casimir.co' : `https://docs.${process.env.STAGE}.casimir.co`
    process.env.USERS_URL = process.env.STAGE === 'prod' ? 'https://users.casimir.co' : `https://users.${process.env.STAGE}.casimir.co`
    process.env.CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')

    const networkKey = process.env.NETWORK?.toUpperCase() || process.env.FORK?.toUpperCase() || 'TESTNET'
    process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL[networkKey]
    process.env.FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.FACTORY_ADDRESS
    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_VIEWS_ADDRESS
    
    process.env.PUBLIC_BLOG_URL = process.env.BLOG_URL
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_FACTORY_ADDRESS = process.env.FACTORY_ADDRESS
    process.env.PUBLIC_SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS
    process.env.PUBLIC_SSV_VIEWS_ADDRESS = process.env.SSV_VIEWS_ADDRESS
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')
    process.env.PUBLIC_WALLET_CONNECT_PROJECT_ID = await getSecret('casimir-wallet-connect-project-id')
    
    await run('npm run build --workspace @casimir/ethereum')
    await run('npm run docgen --workspace @casimir/docs')
    await run('npm run build --workspace @casimir/docs')
    await run('npm run build --workspace @casimir/landing')
    await run('npm run build --workspace @casimir/users')
    await run('npm run build --workspace @casimir/web')

    await run('npm run bootstrap --workspace @casimir/cdk')
    await run('npm run synth --workspace @casimir/cdk')

    console.log('🚀 Deploying CDK app')
    await run('npm run deploy --workspace @casimir/cdk')
}()





