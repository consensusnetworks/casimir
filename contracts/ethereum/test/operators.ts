import { ethers, network } from 'hardhat'
import { loadFixture, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { deploymentFixture } from './fixtures/shared'
import { ICasimirRegistry } from '../build/artifacts/types'
import { round } from '../helpers/math'
import { initiateDepositHandler } from '../helpers/oracle'

describe('Operators', async function () {
    it('Registration of operators 1 through 4 creates 4 eligible operators', async function () {
        const { registry, views } = await loadFixture(deploymentFixture)
        const operatorIds = await registry.getOperatorIds()
        const startIndex = 0
        const endIndex = operatorIds.length
        const operators = await views.getOperators(startIndex, endIndex)
        expect(operators.length).equal(4)
        expect(operators).to.satisfy((operators: ICasimirRegistry.OperatorStruct[]) => {
            const expectedActive = operators.every(operator => operator.active === true)
            const expectedCollateral = operators.every(operator => operator.collateral.toString() === ethers.utils.parseEther('4.0').toString())
            const expectedResharing = operators.every(operator => operator.resharing === false)
            return expectedActive && expectedCollateral && expectedResharing
        })
    })

    it('First initiated deposit uses 4 eligible operators', async function () {
        const { manager, registry, views, oracle } = await loadFixture(deploymentFixture)
        const [, user] = await ethers.getSigners()

        const depositAmount = round(32 * ((100 + await manager.feePercent()) / 100), 10)
        const deposit = await manager.connect(user).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await deposit.wait()

        await initiateDepositHandler({ manager, signer: oracle })

        const operatorIds = await registry.getOperatorIds()
        const startIndex = 0
        const endIndex = operatorIds.length
        const operators = await views.getOperators(startIndex, endIndex)

        expect(operators).to.satisfy((operators: ICasimirRegistry.OperatorStruct[]) => {
            const operatorsWithPools = operators.filter(operator => Number(operator.poolCount.toString()) === 1)
            return operatorsWithPools.length === 4
        })
    })

    it('Operator deregistration with 1 pool emits 1 reshare request', async function () {
        const { manager, registry, ssvNetworkViews, oracle } = await loadFixture(deploymentFixture)
        const [, user] = await ethers.getSigners()

        const depositAmount = round(32 * ((100 + await manager.feePercent()) / 100), 10)
        const deposit = await manager.connect(user).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await deposit.wait()

        await initiateDepositHandler({ manager, signer: oracle })

        const operatorIds = await registry.getOperatorIds()
        const deregisteringOperatorId = operatorIds[0]
        const operatorOwnerAddress = (await ssvNetworkViews.getOperatorById(deregisteringOperatorId)).owner
        const operatorOwnerSigner = ethers.provider.getSigner(operatorOwnerAddress)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const requestDeregistration = await registry.connect(operatorOwnerSigner).requestDeregistration(deregisteringOperatorId)
        await requestDeregistration.wait()
        const deregisteringOperator = await registry.getOperator(deregisteringOperatorId)
        const resharesRequestedEvents = await manager.queryFilter(manager.filters.ResharesRequested(), -1)
        const resharesRequestedEvent = resharesRequestedEvents[0]
        
        expect(deregisteringOperator.resharing).equal(true)        
        expect(resharesRequestedEvents.length).equal(1)
        expect(resharesRequestedEvent.args?.operatorId.toNumber()).equal(deregisteringOperatorId.toNumber())
    })

    it('Operator deregistration with 0 pools allows immediate collateral withdrawal', async function () {
        const { manager, registry, ssvNetworkViews } = await loadFixture(deploymentFixture)

        const operatorIds = await registry.getOperatorIds()
        const deregisteringOperatorId = operatorIds[0]
        const [ operatorOwnerAddress ] = await ssvNetworkViews.getOperatorById(deregisteringOperatorId)
        const operatorOwnerSigner = ethers.provider.getSigner(operatorOwnerAddress)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const requestDeregistration = await registry.connect(operatorOwnerSigner).requestDeregistration(deregisteringOperatorId)
        await requestDeregistration.wait()
        const deregisteringOperator = await registry.getOperator(deregisteringOperatorId)
        const resharesRequestedEvents = await manager.queryFilter(manager.filters.ResharesRequested(), -1)

        expect(deregisteringOperator.active).equal(false)
        expect(deregisteringOperator.resharing).equal(false)        
        expect(resharesRequestedEvents.length).equal(0)

        const operatorOwnerBalanceBefore = await ethers.provider.getBalance(operatorOwnerAddress)
        const withdrawCollateral = await registry.connect(operatorOwnerSigner).withdrawCollateral(deregisteringOperatorId, ethers.utils.parseEther('4'))
        await withdrawCollateral.wait()
        const operatorOwnerBalanceAfter = await ethers.provider.getBalance(operatorOwnerAddress)
        const deregisteredOperator = await registry.getOperator(deregisteringOperatorId)
        
        expect(deregisteredOperator.collateral.toString()).equal('0')
        expect(ethers.utils.formatEther(operatorOwnerBalanceAfter.sub(operatorOwnerBalanceBefore).toString())).contains('3.9')
    })
})