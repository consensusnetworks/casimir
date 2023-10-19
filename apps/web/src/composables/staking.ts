import { ethers } from 'ethers'
import { ProviderString } from '@casimir/types'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnectV2 from './walletConnectV2'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import { CasimirManager } from '@casimir/ethereum/build/@types'

const { factory, provider } = useEnvironment()
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { getWalletConnectSignerV2 } = useWalletConnectV2()

const managerConfigs = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
    return await factory.getManagerConfig(id)
}))
const manager = new ethers.Contract(managerConfigs[0].managerAddress, ICasimirManagerAbi, provider) as CasimirManager

export default function useStaking() {
    
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
            // TODO: Fix this bug
            // const fees = await manager.FEE_PERCENT()
            const fees = 5
            const feesRounded = Math.round(fees * 100) / 100
            return feesRounded
        } catch (err: any) {
            console.error(`There was an error in getDepositFees function: ${JSON.stringify(err)}`)
            throw new Error(err)
        }
    }    

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
        deposit, 
        getDepositFees,
        getUserStake,
        withdraw 
    }
}