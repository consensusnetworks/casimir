import { run } from '@casimir/helpers'

/**
 * Test ethereum contracts
 */
void async function () {
    await run('npm run build --workspace @casimir/ethereum')
    await run('npx mocha --require hardhat/register --recursive --exit --extension ts --timeout 250000')
}()