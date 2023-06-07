import { ethers } from 'hardhat'

void async function () {
    const multisigArgs = {
        owners: [
            process.env.OWNER_1_ADDRESS,
            process.env.OWNER_2_ADDRESS,
            process.env.OWNER_3_ADDRESS,
            process.env.OWNER_4_ADDRESS,
            process.env.OWNER_5_ADDRESS
        ]
    }
    const multisigFactory = await ethers.getContractFactory('CasimirMultisig')
    const multisig = await multisigFactory.deploy(...Object.values(multisigArgs))
    await multisig.deployed()
    console.log(`CasimirMultisig contract deployed to ${multisig.address}`)
}()