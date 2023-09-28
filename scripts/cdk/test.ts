import { getSecret, loadCredentials } from '@casimir/aws'
import { run } from '@casimir/shell'

/**
 * Test CDK stacks
 */
void async function () {
    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'dev'
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-2'

    await loadCredentials()
    process.env.AWS_ACCOUNT = await getSecret('casimir-aws-account')
    process.env.USERS_URL = `https://users.${process.env.STAGE}.casimir.co`

    await run('npm run build --workspace @casimir/ethereum')
    await run('npm run build:docs --workspace @casimir/ethereum')
    await run('npm run build --workspace @casimir/landing')
    await run('npm run build --workspace @casimir/users')
    await run('npm run build --workspace @casimir/web')

    console.log('🚀 Testing CDK app')
    await run('npm run test --workspace @casimir/cdk')
}()