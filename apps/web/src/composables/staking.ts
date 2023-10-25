import { ref } from 'vue'
import { ethers } from 'ethers'
import { ProviderString } from '@casimir/types'
import useContracts from '@/composables/contracts'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnectV2 from './walletConnectV2'
import { CasimirManager } from '@casimir/ethereum/build/@types'

const { getContracts } = useContracts()
const { provider } = useEnvironment()
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { getWalletConnectSignerV2 } = useWalletConnectV2()

const stakingComposableInitialized = ref(false)

let defaultManager: CasimirManager
let eigenManager: CasimirManager

export default function useStaking() {

    async function initializeStakingComposable(){
        if (stakingComposableInitialized.value) return
        try {
            /* Get Managers */
            const { defaultManager: defaultManagerFromContracts, eigenManager: eigenManagerFromContracts } = await getContracts()
            defaultManager = defaultManagerFromContracts
            eigenManager = eigenManagerFromContracts
            stakingComposableInitialized.value = true
        } catch (error) {
            console.log('Error initializing staking component :>> ', error)
        }
    }
    
    async function deposit({ amount, walletProvider, type }: { amount: string, walletProvider: ProviderString, type: 'default' | 'eigen' }) {
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
            const manager = type === 'default' ? defaultManager : eigenManager
            const managerSigner = (manager as CasimirManager).connect(signer as ethers.Signer)
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
            // const fees = await (manager as CasimirManager).FEE_PERCENT()
            const fees = 5
            const feesRounded = Math.round(fees * 100) / 100
            return feesRounded
        } catch (err: any) {
            console.error(`There was an error in getDepositFees function: ${JSON.stringify(err)}`)
            throw new Error(err)
        }
    }    

    async function getUserStake(address: string): Promise<number> {
        if (!stakingComposableInitialized.value) return 0
        try {
            const defaultManagerBigNumber = await (defaultManager as CasimirManager).getUserStake(address)
            const number = parseFloat(ethers.utils.formatEther(defaultManagerBigNumber))
            const eigenManagerBigNumber = await (eigenManager as CasimirManager).getUserStake(address)
            const number2 = parseFloat(ethers.utils.formatEther(eigenManagerBigNumber))
            const total = number + number2
            return total
        } catch (err) {
            console.error(`There was an error in getUserStake function: ${JSON.stringify(err)}`)
            return 0
        }
    }

    async function withdraw({ amount, walletProvider, type }: { amount: string, walletProvider: ProviderString, type: 'default' | 'eigen' }) {
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
        const manager = type === 'default' ? defaultManager : eigenManager
        const managerSigner = (manager as CasimirManager).connect(signer as ethers.Signer)
        const value = ethers.utils.parseEther(amount)
        // const withdrawableBalance = await (manager as CasimirManager).getWithdrawableBalance()
        const bufferedBalance = await managerSigner.getBufferedBalance()
        const bufferedBalanceNumber = parseFloat(ethers.utils.formatEther(bufferedBalance))
        const result = await managerSigner.requestWithdrawal(value)
        return {
            result,
            bufferedBalance: bufferedBalanceNumber
        }
    }

    return { 
        stakingComposableInitialized,
        initializeStakingComposable,
        deposit, 
        getDepositFees,
        getUserStake,
        withdraw 
    }
}