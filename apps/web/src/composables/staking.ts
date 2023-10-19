import { ethers } from 'ethers'
import { ProviderString } from '@casimir/types'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnectV2 from './walletConnectV2'
import { CasimirManager } from '@casimir/ethereum/build/@types'

const { manager } = useEnvironment()
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { getWalletConnectSignerV2 } = useWalletConnectV2()

export default function useStaking() {
    
    async function deposit({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        try {
            let signer
            if (ethersProviderList.includes(walletProvider)) {
                signer = getEthersBrowserSigner(walletProvider)
            } else if (walletProvider === 'WalletConnect') {
                await getWalletConnectSignerV2()
            } else if (walletProvider === 'Ledger') {
                getEthersLedgerSigner()
            } else if (walletProvider === 'Trezor') {
                getEthersTrezorSigner()
            } else {
                throw new Error(`Invalid wallet provider: ${walletProvider}`)
            }
            const managerSigner = (manager.value as CasimirManager).connect(signer as ethers.Signer)
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
            // const fees = await (manager.value as CasimirManager).FEE_PERCENT()
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
            const bigNumber = await (manager.value as CasimirManager).getUserStake(address)
            const number = parseFloat(ethers.utils.formatEther(bigNumber))
            return number
        } catch (err) {
            console.error(`There was an error in getUserStake function: ${JSON.stringify(err)}`)
            return 0
        }
    }

    async function withdraw({ amount, walletProvider }: { amount: string, walletProvider: ProviderString }) {
        let signer
        if (ethersProviderList.includes(walletProvider)) {
            signer = getEthersBrowserSigner(walletProvider)
        } else if (walletProvider === 'WalletConnect') {
            await getWalletConnectSignerV2()
        } else if (walletProvider === 'Ledger') {
            getEthersLedgerSigner()
        } else if (walletProvider === 'Trezor') {
            getEthersTrezorSigner()
        } else {
            throw new Error(`Invalid wallet provider: ${walletProvider}`)
        }
        const managerSigner = (manager.value as CasimirManager).connect(signer as ethers.Signer)
        const value = ethers.utils.parseEther(amount)
        // const withdrawableBalance = await (manager.value as CasimirManager).getWithdrawableBalance()
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