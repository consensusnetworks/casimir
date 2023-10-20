import { ethers, network, upgrades } from 'hardhat'
import { loadFixture, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deploymentFixture } from './fixtures/shared'
import requestConfig from '@casimir/functions/Functions-request-config'
import ICasimirRegistryDevAbi from '../build/abi/ICasimirRegistryDev.json'
import ISSVViewsAbi from '../build/abi/ISSVViews.json'
import { CasimirRegistryDev, CasimirUpkeepDev, ISSVViews } from '../build/@types'

describe('Upgrade', async function () {
    it('Upgrade contracts with dev versions', async function () {
        const {
            functionsBillingRegistry,
            functionsOracle,
            managerBeacon,
            poolBeacon,
            registryBeacon,
            upkeepBeacon,
            viewsBeacon,
            factory,
            daoOracle,
            donTransmitter
        } = await loadFixture(deploymentFixture)
        
        const beaconDevLibraryFactory = await ethers.getContractFactory('CasimirBeaconDev')
        const beaconDevLibrary = await beaconDevLibraryFactory.deploy()
    
        const managerDevBeaconFactory = await ethers.getContractFactory('CasimirManagerDev', {
            libraries: {
                CasimirBeaconDev: beaconDevLibrary.address
            }
        })
        const managerDevBeacon = await upgrades.upgradeBeacon(managerBeacon.address, managerDevBeaconFactory, { 
            constructorArgs: [
                functionsBillingRegistry.address,
                process.env.KEEPER_REGISTRAR_ADDRESS as string,
                process.env.KEEPER_REGISTRY_ADDRESS as string,
                process.env.LINK_TOKEN_ADDRESS as string,
                process.env.SSV_NETWORK_ADDRESS as string,
                process.env.SSV_TOKEN_ADDRESS as string,
                process.env.SWAP_FACTORY_ADDRESS as string,
                process.env.SWAP_ROUTER_ADDRESS as string,
                process.env.WETH_TOKEN_ADDRESS as string
            ],
            unsafeAllow: ['external-library-linking']
        })
        await managerDevBeacon.deployed()
    
        const poolDevBeaconFactory = await ethers.getContractFactory('CasimirPoolDev')
        const poolDevBeacon = await upgrades.upgradeBeacon(poolBeacon.address, poolDevBeaconFactory, {
            constructorArgs: [
                process.env.DEPOSIT_CONTRACT_ADDRESS as string
            ]
        })
        await poolDevBeacon.deployed()
    
        const registryDevBeaconFactory = await ethers.getContractFactory('CasimirRegistryDev')
        const registryDevBeacon = await upgrades.upgradeBeacon(registryBeacon.address, registryDevBeaconFactory, { 
            constructorArgs: [
                process.env.SSV_VIEWS_ADDRESS as string
            ]
        })
        await registryDevBeacon.deployed()
    
        const upkeepDevBeaconFactory = await ethers.getContractFactory('CasimirUpkeepDev')
        const upkeepDevBeacon = await upgrades.upgradeBeacon(upkeepBeacon.address, upkeepDevBeaconFactory)
        await upkeepDevBeacon.deployed()
        
        const viewsDevBeaconFactory = await ethers.getContractFactory('CasimirViewsDev')
        const viewsDevBeacon = await upgrades.upgradeBeacon(viewsBeacon.address, viewsDevBeaconFactory)
        await viewsDevBeacon.deployed()
    
        const factoryDevFactory = await ethers.getContractFactory('CasimirFactoryDev', {
            libraries: {
                CasimirBeaconDev: beaconDevLibrary.address
            }
        })
        const factoryDev = await upgrades.upgradeProxy(factory.address, factoryDevFactory, {
            constructorArgs: [
                managerBeacon.address,
                poolBeacon.address,
                registryBeacon.address,
                upkeepBeacon.address,
                viewsBeacon.address
            ],
            unsafeAllow: ['external-library-linking'] 
        })
        await factoryDev.deployed()

        const privateStrategy = {
            minCollateral: ethers.utils.parseEther('1.0'),
            lockPeriod: 0,
            userFee: 5,
            compoundStake: true,
            eigenStake: false,
            liquidStake: false,
            privateOperators: true,
            verifiedOperators: false
        }
        const deployPrivateStrategy = await factory.deployManager(
            daoOracle.address,
            functionsOracle.address,
            privateStrategy
        )
        await deployPrivateStrategy.wait()
        const [defaultManagerId, privateManagerId] = await factory.getManagerIds()
        const [privateManagerAddress, privateRegistryAddress, privateUpkeepAddress, privateViewsAddress] = await factory.getManagerConfig(privateManagerId)
        // const privateManager = await ethers.getContractAt('CasimirManager', privateManagerAddress) as CasimirManagerDev
        const privateRegistry = await ethers.getContractAt('CasimirRegistryDev', privateRegistryAddress) as CasimirRegistryDev
        const privateUpkeep = await ethers.getContractAt('CasimirUpkeepDev', privateUpkeepAddress) as CasimirUpkeepDev
        // const privateViews = await ethers.getContractAt('CasimirViews', privateViewsAddress) as CasimirViewsDev
    
        requestConfig.args[1] = privateViewsAddress
        const fulfillGasLimit = 300000
        const setRequest = await privateUpkeep.setFunctionsRequest(requestConfig.source, requestConfig.args, fulfillGasLimit)
        await setRequest.wait()
    
        await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, functionsOracle.address])
        await functionsOracle.setRegistry(functionsBillingRegistry.address)
        await functionsOracle.addAuthorizedSenders([donTransmitter.address, privateManagerAddress])
    
        const ssvViews = await ethers.getContractAt(ISSVViewsAbi, process.env.SSV_VIEWS_ADDRESS as string) as ISSVViews
        const operatorId = 208
        const registrationCollateral = ethers.utils.parseEther('10')
        const [operatorOwnerAddress] = await ssvViews.getOperatorById(operatorId)
        const operatorOwnerSigner = ethers.provider.getSigner(operatorOwnerAddress)
        const currentBalance = await ethers.provider.getBalance(operatorOwnerAddress)
        const nextBalance = currentBalance.add(registrationCollateral)
        await setBalance(operatorOwnerAddress, nextBalance)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const registerOperator = privateRegistry.connect(operatorOwnerSigner).registerOperator(operatorId, { value: registrationCollateral })
        await expect(registerOperator).to.be.revertedWithCustomError(privateRegistry, 'OperatorNotPrivate')

        const [, defaultRegistryAddress] = await factory.getManagerConfig(defaultManagerId)
        const defaultRegistry = await ethers.getContractAt(ICasimirRegistryDevAbi, defaultRegistryAddress) as CasimirRegistryDev
        const registerOperatorDefault = await defaultRegistry.connect(operatorOwnerSigner).registerOperator(operatorId, { value: registrationCollateral })
        await registerOperatorDefault.wait()

        const operator = await defaultRegistry.getOperator(operatorId)
        expect(operator.active).equal(true)
    })
})