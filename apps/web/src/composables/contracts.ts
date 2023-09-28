import { ref, readonly } from 'vue'
import { ethers } from 'ethers'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnectV2 from './walletConnectV2'
import { ProviderString } from '@casimir/types'
import { Operator } from '@casimir/ssv'

const { ethereumUrl, managerAddress, registryAddress, viewsAddress } = useEnvironment()
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const manager: CasimirManager & ethers.Contract = new ethers.Contract(managerAddress, ICasimirManagerAbi, provider) as CasimirManager
const views: CasimirViews & ethers.Contract = new ethers.Contract(viewsAddress, ICasimirViewsAbi, provider) as CasimirViews
const registry: CasimirRegistry & ethers.Contract = new ethers.Contract(registryAddress, ICasimirRegistryAbi, provider) as CasimirRegistry

const operators = ref<Operator[]>([])
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { getWalletConnectSignerV2 } = useWalletConnectV2()

export default function useContracts() {
    
    async function deposit({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        try {
            const signerCreators = {
                'Browser': getEthersBrowserSigner,
                'Ledger': getEthersLedgerSigner,
                'Trezor': getEthersTrezorSigner,
                'WalletConnect': getWalletConnectSignerV2
            }
            const signerType = ethersProviderList.includes(walletProvider) ? 'Browser' : walletProvider
            const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
            let signer
            if (walletProvider === 'WalletConnect') {
                signer = await signerCreator(walletProvider)
            } else {
                signer = signerCreator(walletProvider)
            }
            const managerSigner = manager.connect(signer as ethers.Signer)
            const fees = await getDepositFees()
            const depositAmount = parseFloat(amount) * ((100 + fees) / 100)
            const value = ethers.utils.parseEther(depositAmount.toString())
            return await managerSigner.depositStake({ value, type: 2 })
        } catch (err) {
            console.error(`There was an error in deposit function: ${JSON.stringify(err)}`)
            return false
        }
    }

    async function getDepositFees(): Promise<number> {
        try {
            const fees = await manager.FEE_PERCENT()
            const feesRounded = Math.round(fees * 100) / 100
            return feesRounded
        } catch (err: any) {
            console.error(`There was an error in getDepositFees function: ${JSON.stringify(err)}`)
            throw new Error(err)
        }
    }

    // async function _getSSVOperators(): Promise<SSVOperator[]> {
    //     const ownerAddresses = (user?.value as UserWithAccountsAndOperators).accounts.map((account: Account) => account.address) as string[]
    //     // const ownerAddressesTest = ['0x9725Dc287005CB8F11CA628Bb769E4A4Fc8f0309']
    //     try {
    //         // const promises = ownerAddressesTest.map((address) => _querySSVOperators(address))
    //         const promises = ownerAddresses.map((address) => _querySSVOperators(address))
    //         const settledPromises = await Promise.allSettled(promises) as Array<PromiseFulfilledResult<any>>
    //         const operators = settledPromises
    //             .filter((result) => result.status === 'fulfilled')
    //             .map((result) => result.value)

    //         const ssvOperators = (operators[0] as Array<any>).map((operator) => {
    //             const { id, fee, name, owner_address, performance } = operator
    //             return {
    //                 id: id.toString(),
    //                 fee: ethers.utils.formatEther(fee),
    //                 name,
    //                 ownerAddress: owner_address,
    //                 performance
    //             } as SSVOperator
    //         })
            
    //         return ssvOperators
    //     } catch (err) {
    //         console.error(`There was an error in _getSSVOperators function: ${JSON.stringify(err)}`)
    //         return []
    //     }
    // }

    async function getUserStake(address: string): Promise<number> {
        try {
            const bigNumber = await manager.getUserStake(address)
            const number = parseFloat(ethers.utils.formatEther(bigNumber))
            return number
        } catch (err) {
            console.error(`There was an error in getUserStake function: ${JSON.stringify(err)}`)
            return 0
        }
    }

    async function _querySSVOperators(address: string) {
        try {
            const network = 'prater'
            const url = `https://api.ssv.network/api/v3/${network}/operators/owned_by/${address}`
            const response = await fetch(url)
            const { operators } = await response.json()
            return operators
        } catch (err) {
            console.error(`There was an error in _querySSVOperators function: ${JSON.stringify(err)}`)
            return []
        }
    }

    async function withdraw({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        const signerCreators = {
            'Browser': getEthersBrowserSigner,
            'Ledger': getEthersLedgerSigner,
            'Trezor': getEthersTrezorSigner,
            'WalletConnect': getWalletConnectSignerV2
        }
        const signerType = ['MetaMask', 'CoinbaseWallet'].includes(walletProvider) ? 'Browser' : walletProvider
        const signerCreator = signerCreators[signerType as keyof typeof signerCreators]
        let signer
            if (walletProvider === 'WalletConnect') {
                signer = await signerCreator(walletProvider)
            } else {
                signer = signerCreator(walletProvider)
            }
        const managerSigner = manager.connect(signer as ethers.Signer)
        const value = ethers.utils.parseEther(amount)
        // const withdrawableBalance = await manager.getWithdrawableBalance()
        const result = await managerSigner.requestWithdrawal(value)
        return await result.wait()
    }

    return { 
        manager,
        operators,
        registry,
        views,
        deposit, 
        getDepositFees,
        getUserStake,
        withdraw 
    }
}