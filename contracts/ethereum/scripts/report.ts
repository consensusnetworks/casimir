import { ethers } from 'hardhat'
import { CasimirFactory, CasimirManager, CasimirRegistry, CasimirUpkeep, CasimirViews } from '../build/@types'
import ICasimirFactoryAbi from '../build/abi/ICasimirFactory.json'
import ICasimirManagerAbi from '../build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '../build/abi/ICasimirRegistry.json'
import ICasimirUpkeepAbi from '../build/abi/ICasimirUpkeep.json'
import ICasimirViewsAbi from '../build/abi/ICasimirViews.json'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'
import { run } from '@casimir/shell'

void async function() {
    process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL['TESTNET']
    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_BILLING_REGISTRY_ADDRESS
    process.env.FUNCTIONS_ORACLE_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_ORACLE_ADDRESS
    const [owner] = await ethers.getSigners()
    const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL['TESTNET'])
    const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, ICasimirFactoryAbi, provider) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const manager = new ethers.Contract(managerConfig.managerAddress, ICasimirManagerAbi, provider) as CasimirManager
    // const registry = new ethers.Contract(managerConfig.registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry
    // const upkeep = new ethers.Contract(managerConfig.upkeepAddress, ICasimirUpkeepAbi, provider) as CasimirUpkeep
    // const views = new ethers.Contract(managerConfig.viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

    const pause = await manager.connect(owner).setPaused(false)
    await pause.wait()
    // const requestReport = await upkeep.connect(owner).requestReport()
    // await requestReport.wait()
    // run('npm run dev --workspace @casimir/functions')
}()