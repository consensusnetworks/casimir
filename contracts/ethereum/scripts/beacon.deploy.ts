import { deployContract } from '@casimir/hardhat-helpers'

void async function () {
    const name = 'DepositContract'
    const { address } = await deployContract(name)
    console.log(`${name} contract deployed to ${address}`)
    process.exit(0)
}()