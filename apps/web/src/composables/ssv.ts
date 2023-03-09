import { ethers } from 'ethers'
import { SSVManager } from '@casimir/ethereum/build/artifacts/types'
import { abi } from '@casimir/ethereum/build/artifacts/src/SSVManager.sol/SSVManager.json'
import useEnvironment from './environment'
import useUsers from './users'
import useEthers from './ethers'
import useLedger from './ledger'
import useTrezor from './trezor'
import useWalletConnect from './walletConnect'
import { ProviderString } from '@casimir/types'
import { Pool } from '@casimir/types'

/** SSV Manager contract */
let ssvManager: SSVManager

export default function useSSV() {
    const { ethereumURL } = useEnvironment()
    const { getEthersBrowserSigner } = useEthers()
    const { getEthersLedgerSigner } = useLedger()
    const { getEthersTrezorSigner } = useTrezor()
    const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()

    if (!ssvManager) {
        ssvManager = (() => {
            const address = import.meta.env.PUBLIC_SSV_MANAGER
            if (!address) console.log(
                `
                The PUBLIC_SSV_MANAGER environment variable is empty.\n
                If you are on mainnet or testnet, the contract does not exist yet.\n
                If you are on the local network, check your terminal logs for a contract address or errors.
                `
            )
            return new ethers.Contract(address, abi) as SSVManager
        })()
    }

    async function deposit({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        const signerCreators = {
            'Browser': getEthersBrowserSigner,
            'Ledger': getEthersLedgerSigner,
            'Trezor': getEthersTrezorSigner,
            'WalletConnect': getEthersWalletConnectSigner
        }
        const signerType = ['MetaMask', 'CoinbaseWallet'].includes(walletProvider) ? 'Browser' : walletProvider
        const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
        let signer = signerCreator(walletProvider)
        if (isWalletConnectSigner(signer)) signer = await signer
        const ssvManagerSigner = ssvManager.connect(signer as ethers.Signer)
        const fees = await ssvManagerSigner.getFees()
        const { LINK, SSV } = fees
        const feesTotalPercent = LINK + SSV
        const depositAmount = parseFloat(amount) * ((100 + feesTotalPercent) / 100)
        const value = ethers.utils.parseEther(depositAmount.toString())
        const result = await ssvManagerSigner.deposit({ value, type: 0 })
        return await result.wait()
    }

    async function getDepositFees() {
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
        const ssvManagerProvider = ssvManager.connect(provider)
        const fees = await ssvManagerProvider.getFees()
        const { LINK, SSV } = fees
        const feesTotalPercent = LINK + SSV
        const feesRounded = Math.round(feesTotalPercent * 100) / 100
        return feesRounded
    }

    async function getUserPools(userAddress: string): Promise<Pool[]> {
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
        const ssvManagerProvider = ssvManager.connect(provider)
        const userPoolsIds = await ssvManagerProvider.getUserPoolIds(userAddress)
        return await Promise.all(userPoolsIds.map(async (poolId: number) => {
            const { balance, userBalance } = await ssvManagerProvider.getPoolUserDetails(poolId, userAddress)
            let pool: Pool = {
                id: poolId,
                rewards: ethers.utils.formatEther(balance.rewards),
                stake: ethers.utils.formatEther(balance.stake),
                userRewards: ethers.utils.formatEther(userBalance.rewards),
                userStake: ethers.utils.formatEther(userBalance.stake)
            }

            const validatorPublicKey = await ssvManagerProvider.getPoolValidatorPublicKey(poolId) // Public key bytes (i.e., 0x..)
            if (validatorPublicKey) {

                // Validator data from beaconcha.in hardcoded for now
                // const response = await fetch(`https://prater.beaconcha.in/api/v1/validator/${validatorPublicKey}`)
                // const { data } = await response.json()
                // const { status } = data
                const validator = {
                    publicKey: validatorPublicKey,
                    status: 'Active',
                    effectiveness: '0%',
                    apr: '0%', // See issue #205 https://github.com/consensusnetworks/casimir/issues/205#issuecomment-1338142532
                    url: `https://prater.beaconcha.in/validator/${validatorPublicKey}`
                }
                const operatorIds = await ssvManagerProvider.getPoolOperatorIds(poolId) // Operator ID uint32[] (i.e., [1, 2, 3, 4])
                const operators = await Promise.all(operatorIds.map(async (operatorId: number) => {
                    const response = await fetch(`https://api.ssv.network/api/v3/operators/${operatorId}`)
                    const { performance } = await response.json()
                    return {
                        id: operatorId,
                        '24HourPerformance': performance['24h'],
                        '30DayPerformance': performance['30d'],
                        url: `https://explorer.ssv.network/operators/${operatorId}`
                    }
                }))

                pool = {
                    ...pool,
                    validator,
                    operators
                }
            }
            
            const { user } = useUsers()
            user.value?.pools.push(pool)
            
            return pool
        }))
    }

    return { ssvManager, deposit, getDepositFees, getUserPools }
}