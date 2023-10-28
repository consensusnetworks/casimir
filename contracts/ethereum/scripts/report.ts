import { ethers } from 'hardhat'
import { CasimirFactory, CasimirUpkeep, FunctionsBillingRegistry } from '../build/@types'
import ICasimirFactoryAbi from '../build/abi/ICasimirFactory.json'
import ICasimirUpkeepAbi from '../build/abi/ICasimirUpkeep.json'
import FunctionsBillingRegistryAbi from '../build/abi/FunctionsBillingRegistry.json'
import FunctionsOracleAbi from '../build/abi/FunctionsOracle.json'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'

void async function() {
    if (!process.env.ETHEREUM_RPC_URL) throw new Error('No ethereum rpc url provided')
    const [owner, , donTransmitter] = await ethers.getSigners()
    const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL['TESTNET'])

    const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, ICasimirFactoryAbi, provider) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const upkeep = new ethers.Contract(managerConfig.upkeepAddress, ICasimirUpkeepAbi, provider) as CasimirUpkeep
    const setTransmitter = await upkeep.connect(owner).setTransmitter(donTransmitter.address)
    await setTransmitter.wait()
    const resetReport = await upkeep.connect(owner).resetReport(0, 0, 0, 0, 0)
    await resetReport.wait()
    const requestReport = await upkeep.connect(owner).requestReport()
    await requestReport.wait()
}()