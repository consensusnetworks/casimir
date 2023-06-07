import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager, CasimirViews } from '../build/artifacts/types'
import { validatorStore } from '@casimir/data'
import { Validator } from '@casimir/types'
import { getClusterDetails } from '@casimir/ssv'
import { getWithdrawalCredentials } from '@casimir/helpers'
import { getPrice } from '@casimir/uniswap'

const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS as string

const mockValidators: Validator[] = Object.values(validatorStore)

export async function initiateDepositHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    const nonce = await ethers.provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
      from: manager.address,
      nonce
    })
    const poolWithdrawalCredentials = `0x${getWithdrawalCredentials(poolAddress)}`
    const validator = mockValidators.find((validator) => validator.withdrawalCredentials === poolWithdrawalCredentials)
    if (!validator) throw new Error(`No validator found for withdrawal credentials ${poolWithdrawalCredentials}`)
    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
    } = validator
    const clusterDetails = await getClusterDetails({ 
        provider: ethers.provider,
        ownerAddress: manager.address,
        operatorIds
    })
    const { cluster, requiredBalancePerValidator } = clusterDetails

    const processed = false
    const price = await getPrice({ 
        provider: ethers.provider,
        tokenIn: wethTokenAddress,
        tokenOut: ssvTokenAddress,
        uniswapFeeTier: 3000
    })
    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredBalancePerValidator)) * Number(price)).toPrecision(9))

    const initiateDeposit = await manager.connect(signer).initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        feeAmount,
        processed
    )
    await initiateDeposit.wait()
}

export async function depositUpkeepBalanceHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    const processed = false
    const requiredBalancePerUpkeep = ethers.utils.parseEther('0.2') // Double the Chainlink minimum
    const price = await getPrice({ 
        provider: ethers.provider,
        tokenIn: wethTokenAddress,
        tokenOut: linkTokenAddress,
        uniswapFeeTier: 3000
    })
    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredBalancePerUpkeep)) * Number(price)).toPrecision(9))

    const depositUpkeepBalance = await manager.connect(signer).depositUpkeepBalance(
        feeAmount,
        processed
    )
    await depositUpkeepBalance.wait()
}

export async function reportCompletedExitsHandler({ manager, views, signer, args }: { manager: CasimirManager, views: CasimirViews, signer: SignerWithAddress, args: Record<string, any> }) {
    const { count } = args

    // In production, we get the withdrawn exit order from the Beacon API (sorting by withdrawal epoch)
    // Here, we're just reporting them in the order they were exited
    let remaining = count
    let poolIndex = 0
    const stakedPoolIds = await manager.getStakedPoolIds()
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await views.getPoolDetails(poolId)
        if (poolDetails.status === 2 || poolDetails.status === 3) {
            remaining--
            const operatorIds = poolDetails.operatorIds.map((operatorId) => operatorId.toNumber())
            
            // Hardcoded blame to the first operator if less than 32 ETH
            // In production, we use the SSV performance data to determine blame
            let blamePercents = [0, 0, 0, 0]
            if (poolDetails.balance.lt(ethers.utils.parseEther('32'))) {
                blamePercents = [100, 0, 0, 0]
            }

            const clusterDetails = await getClusterDetails({ 
                provider: ethers.provider,
                ownerAddress: manager.address,
                operatorIds
            })
            const { cluster } = clusterDetails
            const reportCompletedExit = await manager.connect(signer).reportCompletedExit(
                poolIndex,
                blamePercents,
                cluster
            )
            await reportCompletedExit.wait()
        }
        poolIndex++
    }
}