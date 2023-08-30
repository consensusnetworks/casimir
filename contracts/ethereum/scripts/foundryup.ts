import { run } from '@casimir/shell'

void async function () {
    const forge = await run('which forge') as string
    if (!forge || forge.includes('not found')) {
        await run('curl -L https://foundry.paradigm.xyz | bash -s -- --yes')
        const foundryup = await run('which foundryup') as string
        if (!foundryup || foundryup.includes('not found')) {
            throw new Error('🚩 Please install foundry (see https://foundry.paradigm.xyz)')
        }
        await run('foundryup')
    }
}()
