import { ethers } from 'hardhat'
import { CasimirFactory, CasimirManager } from '../build/@types'
import ICasimirFactoryAbi from '../build/abi/ICasimirFactory.json'
import ICasimirManagerAbi from '../build/abi/ICasimirManager.json'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'

// V1 testnet rebalance bug 1
// Undo stake ratio sum change 1 -409.082737011318350061 from block 9968492
// Redo stake ratio sum change 1 0.035209244538409142 from block 9968492
// Undo stake ratio sum change 2 617.841429400917953927 from block 9968796
// Redo stake ratio sum change 2 -0.000323535550800035 from block 9968796
// Set latest beacon balance after fees 2 63.998872616 at block 9974789

void async function() {

    const doNotRun = true
    if (doNotRun) {
        throw new Error('Do not run this script. It is archived for internal documentation only.')
    }

    process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL['TESTNET']
    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_BILLING_REGISTRY_ADDRESS
    process.env.FUNCTIONS_ORACLE_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_ORACLE_ADDRESS
    const [owner] = await ethers.getSigners()
    const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL['TESTNET'])
    const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, ICasimirFactoryAbi, provider) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const manager = new ethers.Contract(managerConfig.managerAddress, ICasimirManagerAbi, provider) as CasimirManager

    const wrongStakeRatioSumChange1 = ethers.utils.parseEther('-409.082737011318350061')
    const undoStakeRatioSumChange1 = await manager.connect(owner).unbalanceStake(wrongStakeRatioSumChange1)
    await undoStakeRatioSumChange1.wait()

    const correctStakeRatioSumChange1 = ethers.utils.parseEther('0.035209244538409142')
    const redoStakeRatioSumChange1 = await manager.connect(owner).unbalanceStake(correctStakeRatioSumChange1)
    await redoStakeRatioSumChange1.wait()

    const wrongStakeRatioSumChange2 = ethers.utils.parseEther('617.841429400917953927')
    const undoStakeRatioSumChange2 = await manager.connect(owner).unbalanceStake(wrongStakeRatioSumChange2)
    await undoStakeRatioSumChange2.wait()

    const correctStakeRatioSumChange2 = ethers.utils.parseEther('-0.000323535550800035')
    const redoStakeRatioSumChange2 = await manager.connect(owner).unbalanceStake(correctStakeRatioSumChange2)
    await redoStakeRatioSumChange2.wait()

    const latestBeaconBalanceAfterFees = ethers.utils.parseEther('63.998872616')
    const setLatestBeaconBalanceAfterFees = await manager.connect(owner).setLatestBeaconBalanceAfterFees(latestBeaconBalanceAfterFees)
    await setLatestBeaconBalanceAfterFees.wait()

}()