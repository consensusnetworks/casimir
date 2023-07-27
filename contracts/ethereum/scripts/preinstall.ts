import { run } from '@casimir/helpers'

void async function () {
    const foundryup = await run('which foundryup') as string
    if (foundryup.includes('not found')) {
        await run('curl -L https://foundry.paradigm.xyz | bash -s -- --yes && foundryup')
    }
}()