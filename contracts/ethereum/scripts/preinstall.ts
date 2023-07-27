import { run } from '@casimir/helpers'

void async function () {
    const foundryCheck = await run('foundry --version')
    console.log('foundryCheck', foundryCheck)
    if (!foundryCheck) {
        await run('curl -L https://foundry.paradigm.xyz | bash -s -- --yes && foundryup')
    }
}()