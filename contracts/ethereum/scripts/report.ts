import { ethers } from 'hardhat'
import { CasimirFactory, CasimirUpkeep } from '../build/@types'
import ICasimirFactoryAbi from '../build/abi/ICasimirFactory.json'
import ICasimirUpkeepAbi from '../build/abi/ICasimirUpkeep.json'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'

void async function() {
    if (!process.env.ETHEREUM_RPC_URL) throw new Error('No ethereum rpc url provided')
    const [owner] = await ethers.getSigners()
    const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL['TESTNET'])

    const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, ICasimirFactoryAbi, provider) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const upkeep = new ethers.Contract(managerConfig.upkeepAddress, ICasimirUpkeepAbi, provider) as CasimirUpkeep
    const requestReport = await upkeep.connect(owner).requestReport()
    await requestReport.wait()
    // const checkData = ethers.utils.toUtf8Bytes('')
    // const checkUpkeep = await upkeep.checkUpkeep(checkData)
    // if (checkUpkeep.upkeepNeeded) {
    //     const performData = ethers.utils.toUtf8Bytes('')
    //     const performUpkeep = await upkeep.connect(owner).performUpkeep(performData, { gasLimit: 5000000 })
    //     await performUpkeep.wait()
    // }
}()