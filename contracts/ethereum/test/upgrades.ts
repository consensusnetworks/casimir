// import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { ETHEREUM_CONTRACTS } from '@casimir/env'
import CasimirFactoryAbi from '../build/abi/CasimirFactory.json'
import CasimirManagerDevAbi from '../build/abi/CasimirManagerDev.json'
import CasimirUpkeepDevAbi from '../build/abi/CasimirUpkeepDev.json'
import { CasimirManagerDev, CasimirUpkeepDev } from '../build/@types'

describe('Upgrades', async function () {

    it('Upgrade upkeep with dev', async function () {
        const factory = new ethers.Contract(ETHEREUM_CONTRACTS['TESTNET'].FACTORY_ADDRESS, CasimirFactoryAbi, ethers.provider)
        const [managerId] = await factory.getManagerIds()
        const managerConfig = await factory.getManagerConfig(managerId)

        const managerDevFactory = await ethers.getContractFactory('CasimirManagerDev', {
            libraries: {
                CasimirBeacon: ETHEREUM_CONTRACTS['TESTNET'].BEACON_LIBRARY_ADDRESS
            }
        })
        const managerBeacon = await upgrades.upgradeBeacon(ETHEREUM_CONTRACTS['TESTNET'].MANAGER_BEACON_ADDRESS, managerDevFactory, {
            constructorArgs: [
                ETHEREUM_CONTRACTS['TESTNET'].FUNCTIONS_BILLING_REGISTRY_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].KEEPER_REGISTRAR_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].KEEPER_REGISTRY_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].LINK_TOKEN_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].SSV_NETWORK_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].SSV_TOKEN_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].SWAP_FACTORY_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].SWAP_ROUTER_ADDRESS,
                ETHEREUM_CONTRACTS['TESTNET'].WETH_TOKEN_ADDRESS
            ],
            unsafeAllow: ['external-library-linking']
        })
        await managerBeacon.deployed()
        const manager = new ethers.Contract(managerConfig.managerAddress, CasimirManagerDevAbi, ethers.provider) as CasimirManagerDev
        console.log(`CasimirManager beacon upgraded at ${manager.address}`)

        const upkeepDevFactory = await ethers.getContractFactory('CasimirUpkeepDev')
        const upkeepBeacon = await upgrades.upgradeBeacon(ETHEREUM_CONTRACTS['TESTNET'].UPKEEP_BEACON_ADDRESS, upkeepDevFactory)
        await upkeepBeacon.deployed()
        const upkeep = new ethers.Contract(managerConfig.upkeepAddress, CasimirUpkeepDevAbi, ethers.provider) as CasimirUpkeepDev
        console.log(`CasimirUpkeep beacon upgraded at ${upkeep.address}`)
    })

})