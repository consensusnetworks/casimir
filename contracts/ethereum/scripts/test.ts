import { run } from '@casimir/helpers'

/**
 * Test ethereum contracts
 */
void async function () {
    if (process.env.USE_COVERAGE === 'true') {
        await run('npm run build --workspace @casimir/ethereum')
        await run('USE_IR=false npx hardhat coverage --show-stack-traces')
    } else {
        await run('npx hardhat test --show-stack-traces')
    }
}()