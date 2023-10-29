import { ethers } from 'hardhat'
import { CasimirFactory, CasimirUpkeep } from '../build/@types'
import ICasimirFactoryAbi from '../build/abi/ICasimirFactory.json'
import ICasimirUpkeepAbi from '../build/abi/ICasimirUpkeep.json'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'

void async function() {
    process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL['TESTNET']
    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_BILLING_REGISTRY_ADDRESS
    process.env.FUNCTIONS_ORACLE_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_ORACLE_ADDRESS
    const [owner] = await ethers.getSigners()
    const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL['TESTNET'])
    const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, ICasimirFactoryAbi, provider) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const upkeep = new ethers.Contract(managerConfig.upkeepAddress, ICasimirUpkeepAbi, provider) as CasimirUpkeep
    // const resetReport = await upkeep.connect(owner).resetReport(0, 0, 0, 0, 0)
    // await resetReport.wait()
    const requestReport = await upkeep.connect(owner).requestReport()
    await requestReport.wait()
}()