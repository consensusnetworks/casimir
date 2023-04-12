import { ethers } from 'ethers'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { abi } from '@casimir/ethereum/build/artifacts/src/CasimirManager.sol/CasimirManager.json'
import useEnvironment from './environment'
import useUsers from './users'
import useEthers from './ethers'
import useLedger from './ledger'
import useTrezor from './trezor'
import useWalletConnect from './walletConnect'
import { Account, Pool, ProviderString } from '@casimir/types'
import { ReadyOrStakeString } from '../interfaces'

/** Manager contract */
let casimirManager: CasimirManager

export default function useSSV() {
    const { ethereumURL } = useEnvironment()
    const { getEthersBrowserSigner } = useEthers()
    const { getEthersLedgerSigner } = useLedger()
    const { getEthersTrezorSigner } = useTrezor()
    const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()

    if (!casimirManager) {
        casimirManager = (() => {
            const address = import.meta.env.PUBLIC_CASIMIR_MANAGER
            if (!address) console.log(
                `
                The PUBLIC_CASIMIR_MANAGER environment variable is empty.\n
                If you are on mainnet or testnet, the contract does not exist yet.\n
                If you are on the local network, check your terminal logs for a contract address or errors.
                `
            )
            return new ethers.Contract(address, abi) as CasimirManager
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
        const casimirManagerSigner = casimirManager.connect(signer as ethers.Signer)
        const fees = await casimirManagerSigner.getFees()
        const { LINK, SSV } = fees
        const feesTotalPercent = LINK + SSV
        const depositAmount = parseFloat(amount) * ((100 + feesTotalPercent) / 100)
        const value = ethers.utils.parseEther(depositAmount.toString())
        const result = await casimirManagerSigner.deposit({ value, type: 0 })
        return await result.wait()
    }

    async function getDepositFees() {
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
        const casimirManagerProvider = casimirManager.connect(provider)
        const fees = await casimirManagerProvider.getFees()
        const { LINK, SSV } = fees
        const feesTotalPercent = LINK + SSV
        const feesRounded = Math.round(feesTotalPercent * 100) / 100
        return feesRounded
    }

    async function getPools(address: string, readyOrStake: ReadyOrStakeString): Promise<Pool[]> {
        const { user } = useUsers()
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
        const casimirManagerProvider = casimirManager.connect(provider)
        
        const userStake = await casimirManagerProvider.getUserStake(address) // to get user's stake balance
        const poolStake = await casimirManagerProvider.getStake() // to get total stake balance
        const poolIds = readyOrStake === 'ready' ? await casimirManagerProvider.getReadyPoolIds() : await casimirManagerProvider.getStakedPoolIds() // to get ready (open) pool IDs OR to get staked (active) pool IDs

        console.log('userStake :>> ', ethers.utils.formatEther(userStake))
        console.log('poolStake :>> ', ethers.utils.formatEther(poolStake))
        console.log('poolIds :>> ', poolIds)

        return await Promise.all(poolIds.map(async (poolId: number) => {
            const { deposits, operatorIds, validatorPublicKey } = await casimirManagerProvider.getPool(poolId)
            
            // TODO: Decide when/how to get rewards/userRewards
            let pool: Pool = {
                id: poolId,
                rewards: ethers.utils.formatEther(poolStake),
                stake: ethers.utils.formatEther(poolStake),
                userRewards: ethers.utils.formatEther(userStake),
                userStake: ethers.utils.formatEther(userStake)
            }

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


                // TODO: Replace with less hardcoded network call?
                const operators = await Promise.all(operatorIds.map(async (operatorId: number) => {
                    const network = 'prater'
                    const response = await fetch(`https://api.ssv.network/api/v3/${network}/operators/${operatorId}`)
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
            
            if (readyOrStake === 'stake') {
                user.value?.accounts.forEach((account: Account) => {
                    if (account.address === address) {
                        account.pools ? account.pools.push(pool) : account.pools = [pool]
                    }
                })
            }
            
            return pool
        }))
    }

    async function withdraw({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
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
        const casimirManagerSigner = casimirManager.connect(signer as ethers.Signer)
        const value = ethers.utils.parseEther(amount)
        const result = await casimirManagerSigner.withdraw(value)
        return await result.wait()
    }

    return { casimirManager, deposit, getDepositFees, getPools, withdraw }
}