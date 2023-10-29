import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'
import { ETHEREUM_CONTRACTS } from '@casimir/env'
import CasimirFactoryAbi from '../build/abi/CasimirFactory.json'
import CasimirUpkeepDevAbi from '../build/abi/CasimirUpkeepDev.json'
import FunctionsBillingRegistryAbi from '../build/abi/FunctionsBillingRegistry.json'
import { fulfillReport } from '../helpers/upkeep'
import { CasimirUpkeepDev, FunctionsBillingRegistry } from '../build/@types'

describe('Upgrades', async function () {

    it('Upgrade upkeep with dev', async function () {
        const [owner, daoOracle, donTransmitter] = await ethers.getSigners()

        const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, CasimirFactoryAbi, ethers.provider)
        const [managerId] = await factory.getManagerIds()
        const managerConfig = await factory.getManagerConfig(managerId)

        const upkeepDevFactory = await ethers.getContractFactory('CasimirUpkeepDev')
        const upkeepBeacon = await upgrades.upgradeBeacon(ETHEREUM_CONTRACTS['TESTNET'].UPKEEP_BEACON_ADDRESS, upkeepDevFactory)
        await upkeepBeacon.deployed()
        console.log(`CasimirUpkeep beacon upgraded at ${upkeepBeacon.address}`)
        const upkeep = new ethers.Contract(managerConfig.upkeepAddress, CasimirUpkeepDevAbi, ethers.provider) as CasimirUpkeepDev

        const reportRemainingRequests = await upkeep.getReportRemainingRequests()
        console.log('Report remaining requests', reportRemainingRequests)
        const requestType = await upkeep.getRequestType('0xaf574e98f82d5ea06b985400ad9c5c2a8cbe9f1e960cc39e66ea276a1cf8408c')
        console.log(requestType)

        const checkUpkeepBefore = await upkeep.checkUpkeep('0x')
        console.log('Upkeep needed before', checkUpkeepBefore.upkeepNeeded)
        const functionsBillingRegistry = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_BILLING_REGISTRY_ADDRESS, FunctionsBillingRegistryAbi, ethers.provider) as FunctionsBillingRegistry
        const reportValues = {
            beaconBalance: 31.993754780,
            sweptBalance: 0,
            activatedDeposits: 1,
            forcedExits: 0,
            completedExits: 0,
            compoundablePoolIds: [0, 0, 0, 0, 0]
        }
        await fulfillReport({ donTransmitter, upkeep, functionsBillingRegistry, values: reportValues })
        const checkUpkeepAfter = await upkeep.checkUpkeep('0x')
        console.log('Upkeep needed after', checkUpkeepAfter.upkeepNeeded)
    })

})