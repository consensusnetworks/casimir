import { deployContract } from '@casimir/hardhat-helpers'

void async function () {
    const name = 'DepositContract'
    const { address, deployTransaction } = await deployContract(name)
    const { hash } = deployTransaction
    console.log(`${name} contract deployed to ${address} (see hash ${hash})`)
    process.exit(0)
}()