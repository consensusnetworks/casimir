// Hardhat task to query Casimir and 3rd party contracts

import { subtask, task, types } from 'hardhat/config'
import ICasimirManagerAbi from '../build/abi/ICasimirManager.json'
import ISSVOperatorsAbi from '../build/abi/ISSVOperators.json'
import { ICasimirManager, ISSVOperators } from '../build/@types'

task('query', 'Query Casimir and 3rd party contracts')
    .addOptionalParam('operatorIds', 'Filter by operator ids', undefined, types.string)
    .addOptionalParam('operatorOwnerAddress', 'Filter by operator owner address', undefined, types.string)
    .setAction(async (args, hre) => {
        const { operatorIds, operatorOwnerAddress, userAddresses } = args
        await hre.run('query:deposits', { userAddresses })
        await hre.run('query:operators', { operatorIds, operatorOwnerAddress })
    })

subtask('query:deposits', 'Query deposits')
    .setAction(async (args, hre) => {     
        const manager = await hre.ethers.getContractAt(ICasimirManagerAbi, process.env.MANAGER_ADDRESS as string) as ICasimirManager
        const deposits = await manager.queryFilter(manager.filters.StakeDeposited())
        console.log(deposits)
    })

subtask('query:operators', 'Query operators')
    .addOptionalParam('operatorIds', 'Operator ids', undefined, types.string)
    .addOptionalParam('operatorOwnerAddress', 'Operator owner address', undefined, types.string)
    .setAction(async (args, hre) => {
        const { operatorIds, operatorOwnerAddress } = args
        const ssvOperators = await hre.ethers.getContractAt(ISSVOperatorsAbi, process.env.SSV_NETWORK_ADDRESS as string) as ISSVOperators
    })