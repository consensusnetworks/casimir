import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { thirdUserDepositFixture } from './fixtures/shared'

describe('Guards', async function () {
    it('Fails to deposit exited balance not as pool', async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)

        const [firstPoolId] = await manager.getStakedPoolIds()
        const depositExitedBalance = manager.depositExitedBalance(firstPoolId, { value: ethers.utils.parseEther('1.0') })

        await expect(depositExitedBalance).to.be.revertedWith('Not pool')
    })

    it('Fails to deposit recovered balance not as registry', async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)

        const [firstPoolId] = await manager.getStakedPoolIds()
        const depositRecoveredBalance = manager.depositRecoveredBalance(firstPoolId, { value: ethers.utils.parseEther('1.0') })

        await expect(depositRecoveredBalance).to.be.revertedWith('Not registry')
    })

    it('Fails to deposit cluster balance not as oracle', async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)

        const depositClusterBalance = manager.depositClusterBalance(
            process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657],
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0,
                active: false
            },
            ethers.utils.parseEther('1.0'),
            ethers.utils.parseEther('1.0'),
            false
        )

        await expect(depositClusterBalance).to.be.revertedWith('Not oracle')
    })

    it('Fails to deposit functions balance not as oracle', async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)

        const depositFunctionsBalance = manager.depositFunctionsBalance(
            ethers.utils.parseEther('1.0'),
            ethers.utils.parseEther('1.0'),
            false
        )

        await expect(depositFunctionsBalance).to.be.revertedWith('Not oracle')
    })

    it('Fails to deposit upkeep balance not as oracle', async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)

        const depositUpkeepBalance = manager.depositUpkeepBalance(
            ethers.utils.parseEther('1.0'),
            ethers.utils.parseEther('1.0'),
            false
        )

        await expect(depositUpkeepBalance).to.be.revertedWith('Not oracle')
    })

    it('Fails deployment with missing parameters', async function () {
        const managerConfig = {
            daoOracleAddress: ethers.constants.AddressZero.replace('0x0', '0x1'),
            beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
            functionsBillingRegistryAddress: ethers.constants.AddressZero.replace('0x0', '0x1'),
            functionsOracleAddress: ethers.constants.AddressZero.replace('0x0', '0x1'),
            linkRegistrarAddress: process.env.LINK_REGISTRAR_ADDRESS,
            linkRegistryAddress: process.env.LINK_REGISTRY_ADDRESS,
            linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
            ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
            ssvNetworkViewsAddress: process.env.SSV_NETWORK_VIEWS_ADDRESS,
            ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
            swapFactoryAddress: process.env.SWAP_FACTORY_ADDRESS,
            swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
            wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
        }
        const managerArgs = {
            config: managerConfig
        }
        const managerFactory = await ethers.getContractFactory('CasimirManager')

        managerArgs.config.daoOracleAddress = ethers.constants.AddressZero
        const managerMissingOracleAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingOracleAddress).to.be.revertedWith('Missing oracle address')

        managerArgs.config.daoOracleAddress = ethers.constants.AddressZero.replace('0x0', '0x1')
        managerArgs.config.beaconDepositAddress = ethers.constants.AddressZero
        const managerMissingBeaconDepositAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingBeaconDepositAddress).to.be.revertedWith('Missing beacon deposit address')

        managerArgs.config.beaconDepositAddress = process.env.BEACON_DEPOSIT_ADDRESS
        managerArgs.config.functionsBillingRegistryAddress = ethers.constants.AddressZero
        const managerMissingFunctionsBillingRegistryAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingFunctionsBillingRegistryAddress).to.be.revertedWith('Missing functions billing registry address')

        managerArgs.config.functionsBillingRegistryAddress = ethers.constants.AddressZero.replace('0x0', '0x1')
        managerArgs.config.functionsOracleAddress = ethers.constants.AddressZero
        const managerMissingFunctionsOracleAddress = managerFactory.deploy(...Object.values(managerArgs))
        expect(managerMissingFunctionsOracleAddress).to.be.revertedWith('Missing functions oracle address')

        managerArgs.config.functionsOracleAddress = ethers.constants.AddressZero.replace('0x0', '0x1')
        managerArgs.config.linkRegistrarAddress = ethers.constants.AddressZero
        const managerMissingLinkRegistrarAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingLinkRegistrarAddress).to.be.revertedWith('Missing link registrar address')

        managerArgs.config.linkRegistrarAddress = process.env.LINK_REGISTRAR_ADDRESS
        managerArgs.config.linkRegistryAddress = ethers.constants.AddressZero
        const managerMissingLINKRegistryAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingLINKRegistryAddress).to.be.revertedWith('Missing link registry address')

        managerArgs.config.linkRegistryAddress = process.env.LINK_REGISTRY_ADDRESS
        managerArgs.config.linkTokenAddress = ethers.constants.AddressZero
        const managerMissingLINKTokenAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingLINKTokenAddress).to.be.revertedWith('Missing link token address')

        managerArgs.config.linkTokenAddress = process.env.LINK_TOKEN_ADDRESS
        managerArgs.config.ssvNetworkAddress = ethers.constants.AddressZero
        const managerMissingSSVNetworkAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingSSVNetworkAddress).to.be.revertedWith('Missing SSV network address')

        managerArgs.config.ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS
        managerArgs.config.ssvNetworkViewsAddress = ethers.constants.AddressZero
        const managerMissingSSVNetworkViewsAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingSSVNetworkViewsAddress).to.be.revertedWith('Missing SSV network views address')

        managerArgs.config.ssvNetworkViewsAddress = process.env.SSV_NETWORK_VIEWS_ADDRESS
        managerArgs.config.ssvTokenAddress = ethers.constants.AddressZero
        const managerMissingSSVTokenAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingSSVTokenAddress).to.be.revertedWith('Missing SSV token address')

        managerArgs.config.ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS
        managerArgs.config.swapFactoryAddress = ethers.constants.AddressZero
        const managerMissingSwapFactoryAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingSwapFactoryAddress).to.be.revertedWith('Missing Uniswap factory address')

        managerArgs.config.swapFactoryAddress = process.env.SWAP_FACTORY_ADDRESS
        managerArgs.config.swapRouterAddress = ethers.constants.AddressZero
        const managerMissingSwapRouterAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingSwapRouterAddress).to.be.revertedWith('Missing Uniswap router address')

        managerArgs.config.swapRouterAddress = process.env.SWAP_ROUTER_ADDRESS
        managerArgs.config.wethTokenAddress = ethers.constants.AddressZero
        const managerMissingWETHTokenAddress = managerFactory.deploy(...Object.values(managerArgs))
        await expect(managerMissingWETHTokenAddress).to.be.revertedWith('Missing WETH token address')        
    })
})