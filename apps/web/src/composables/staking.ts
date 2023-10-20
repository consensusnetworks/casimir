import { ref } from 'vue'
import { ethers } from 'ethers'
import { ManagerConfig, ProviderString } from '@casimir/types'
import useEnvironment from './environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnectV2 from './walletConnectV2'
import { CasimirManager, CasimirFactory } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirFactoryAbi from '@casimir/ethereum/build/abi/ICasimirFactory.json'

const { provider } = useEnvironment()
const { ethersProviderList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { getWalletConnectSignerV2 } = useWalletConnectV2()

const stakingComposableInitialized = ref(false)

let manager: CasimirManager

export default function useStaking() {

    async function initializeStakingComposable(){
        if (stakingComposableInitialized.value) return
        try {
            /* Contracts */
            const factoryAddress = import.meta.env.PUBLIC_FACTORY_ADDRESS
            if (!factoryAddress) throw new Error('No manager address provided')
            const factory = new ethers.Contract(factoryAddress, ICasimirFactoryAbi, provider) as CasimirFactory
            const managerConfigs = ref<ManagerConfig[]>([])
            managerConfigs.value = await Promise.all((await factory.getManagerIds()).map(async (id: number) => {
                return await factory.getManagerConfig(id)
            }))
            manager = new ethers.Contract(managerConfigs.value[0].managerAddress, ICasimirManagerAbi, provider) as CasimirManager
            stakingComposableInitialized.value = true
        } catch (error) {
            console.log('Error initializing staking component :>> ', error)
        }
    }
    
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
            const bigNumber = await (manager as CasimirManager).getUserStake(address)
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
        const managerSigner = (manager as CasimirManager).connect(signer as ethers.Signer)
        const value = ethers.utils.parseEther(amount)
        // const withdrawableBalance = await (manager as CasimirManager).getWithdrawableBalance()
        const result = await managerSigner.requestWithdrawal(value)
        return await result.wait()
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