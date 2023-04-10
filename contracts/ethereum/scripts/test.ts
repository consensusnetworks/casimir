import minimist from 'minimist'
import { run } from '@casimir/helpers'

/**
 * Test Ethereum contracts
 * 
 * Arguments:
 *     --clean: whether to clean build directory (override default false)
 */
void async function () {
    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))
    
    /** Default to no clean */
    const clean = argv.clean === 'true' || argv.clean === true

    if (clean) {
        await run('npm run clean --workspace @casimir/ethereum')
    }

    await run('npm run build --workspace @casimir/ethereum')

    run('mocha --require hardhat/register --recursive --exit --extension ts --timeout 60000')
}()