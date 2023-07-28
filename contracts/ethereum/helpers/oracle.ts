import fs from 'fs'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager, CasimirViews } from '../build/@types'
import { PoolStatus, Validator } from '@casimir/types'
import { Scanner } from '@casimir/ssv'
import { getWithdrawalCredentials } from '@casimir/helpers'
import { Factory } from '@casimir/uniswap'

const mockValidatorsPath = './scripts/.out/validators.json'
const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
if (!linkTokenAddress) throw new Error('No link token address provided')
const ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS as string
if (!ssvNetworkAddress) throw new Error('No ssv network address provided')
const ssvNetworkViewsAddress = process.env.SSV_NETWORK_VIEWS_ADDRESS as string
if (!ssvNetworkViewsAddress) throw new Error('No ssv network views address provided')
const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
if (!ssvTokenAddress) throw new Error('No ssv token address provided')
const uniswapV3FactoryAddress = process.env.UNISWAP_V3_FACTORY_ADDRESS as string
if (!uniswapV3FactoryAddress) throw new Error('No uniswap v3 factory address provided')
const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS as string
if (!wethTokenAddress) throw new Error('No weth token address provided')

export async function initiateDepositHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    const mockValidators: Validator[] = JSON.parse(fs.readFileSync(mockValidatorsPath, 'utf8'))[signer.address]
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

    const scanner = new Scanner({
        provider: ethers.provider,
        ssvNetworkAddress,
        ssvNetworkViewsAddress
    })

    const { cluster, requiredBalancePerValidator } = await scanner.getClusterDetails({ 
        ownerAddress: manager.address,
        operatorIds
    })

    const uniswapFactory = new Factory({
        provider: ethers.provider,
        uniswapV3FactoryAddress
    })

    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: wethTokenAddress,
        tokenOut: ssvTokenAddress,
        uniswapFeeTier: 3000
    })

    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredBalancePerValidator)) * price).toPrecision(9))

    const initiateDeposit = await manager.connect(signer).initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        feeAmount,
        false
    )
    await initiateDeposit.wait()
}

export async function depositUpkeepBalanceHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    
    /**
     * In production, we check the upkeep balance before reporting
     * We can set processed to true if the manager has enough SSV tokens
     * Here, we're just depositing double the Chainlink registration minimum
     */
    const requiredBalance = 0.2

    const uniswapFactory = new Factory({
        provider: ethers.provider,
        uniswapV3FactoryAddress
    })

    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: wethTokenAddress,
        tokenOut: linkTokenAddress,
        uniswapFeeTier: 3000
    })
    
    const feeAmount = ethers.utils.parseEther((requiredBalance * price).toPrecision(9))
    
    const depositUpkeepBalance = await manager.connect(signer).depositUpkeepBalance(
        feeAmount,
        false
    )
    await depositUpkeepBalance.wait()
}

export async function reportCompletedExitsHandler({ manager, views, signer, args }: { manager: CasimirManager, views: CasimirViews, signer: SignerWithAddress, args: Record<string, any> }) {
    const { count } = args

    /**
     * In production, we get the completed exit order from the Beacon API (sorting by withdrawn epoch)
     * We check all validators using:
     * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
     * Here, we're just grabbing the next exiting pool for each completed exit
     */
    const stakedPoolIds = await manager.getStakedPoolIds()
    let remaining = count
    let poolIndex = 0
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await views.getPoolDetails(poolId)
        if (poolDetails.status === PoolStatus.EXITING_FORCED || poolDetails.status === PoolStatus.EXITING_REQUESTED) {
            remaining--
            
            /**
             * In production, we use the SSV performance data to determine blame
             * We check all validators using:
             * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
             * Here, we're just hardcoding blame to the first operator if less than 32 ETH
             */
            const operatorIds = poolDetails.operatorIds.map((operatorId) => operatorId.toNumber())

            let blamePercents = [0, 0, 0, 0]
            if (poolDetails.balance.lt(ethers.utils.parseEther('32'))) {
                blamePercents = [100, 0, 0, 0]
            }

            const scanner = new Scanner({
                provider: ethers.provider,
                ssvNetworkAddress,
                ssvNetworkViewsAddress
            })

            const { cluster } = await scanner.getClusterDetails({ 
                ownerAddress: manager.address,
                operatorIds
            })

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