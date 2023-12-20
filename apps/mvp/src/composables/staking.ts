import { readonly, ref, watch } from "vue"
import { ethers } from "ethers"
import { ProviderString } from "@casimir/types"
import useContracts from "@/composables/contracts"
import useEthers from "@/composables/ethers"
import useLedger from "@/composables/ledger"
import useTrezor from "@/composables/trezor"
import useUser from "@/composables/user"
import useWallets from "@/composables/wallets"
import useWalletConnect from "./walletConnect"
import { CasimirManager } from "@casimir/ethereum/build/@types"
import { StakeDetails } from "@casimir/types"

const { getBaseManager, getEigenManager, contractsAreInitialized } = useContracts()
const { browserProvidersList, getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { user } = useUser()
const { detectActiveNetwork, switchEthersNetwork } = useWallets()
const { getWalletConnectSigner } = useWalletConnect()

const stakingComposableInitialized = ref(false)
const awaitingStakeOrWithdrawConfirmation = ref(false)
const userStakeDetails = ref<Array<StakeDetails>>([])
const stakeWithdrawError = ref("")

let baseManager: CasimirManager
let eigenManager: CasimirManager

export default function useStaking() {

    watch(contractsAreInitialized, async () => {
        if (contractsAreInitialized.value) {
            await initializeStakingComposable()
        }
    })

    async function initializeStakingComposable() {
        if (stakingComposableInitialized.value) return
        try {
            stakingComposableInitialized.value = true
            baseManager = getBaseManager()
            eigenManager = getEigenManager()
            await getUserStakeDetails()
        } catch (error) {
            console.log("Error initializing staking component :>> ", error)
        }
    }

    async function deposit({ amount, walletProvider, type, pathIndex }: { amount: string, walletProvider: ProviderString, type: "default" | "eigen", pathIndex: number | undefined}) {
        stakeWithdrawError.value = ""
        try {
            // This is currently handling the connectWalletConnect if no current session
            const activeNetwork = await detectActiveNetwork(walletProvider)
            console.log("activeNetwork :>> ", activeNetwork)
            if (activeNetwork !== 5) {
                await switchEthersNetwork(walletProvider, "0x5")
                return window.location.reload()
            }

            let signer
            if (browserProvidersList.includes(walletProvider)) {
                signer = getEthersBrowserSigner(walletProvider)
            } else if (walletProvider === "WalletConnect") {
                signer = await getWalletConnectSigner()
            } else if (walletProvider === "Ledger") {
                signer = getEthersLedgerSigner(pathIndex)
            } else if (walletProvider === "Trezor") {
                signer = getEthersTrezorSigner()
            } else {
                throw new Error(`Invalid wallet provider: ${walletProvider}`)
            }
            const manager = type === "default" ? baseManager : eigenManager
            const managerSigner = (manager as CasimirManager).connect(signer as ethers.Signer)
            const fees = await getDepositFees()
            const depositAmount = parseFloat(amount) * ((100 + fees) / 100)
            const value = ethers.utils.parseEther(depositAmount.toString())
            awaitingStakeOrWithdrawConfirmation.value = true
            const result = await managerSigner.depositStake({ value, type: 2 })
            const confirmation = await result.wait(1)
            if (confirmation) awaitingStakeOrWithdrawConfirmation.value = false
            return confirmation
        } catch (err: any) {
            console.error(`Error in deposit function: ${JSON.stringify(err)}`)
            if (err.message.includes("denied by the user")) {
                stakeWithdrawError.value = "Transaction denied by the user"
                console.log("Transaction denied by the user")
            } else {
                stakeWithdrawError.value = err.message
            }
            awaitingStakeOrWithdrawConfirmation.value = false
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
            const baseManagerBigNumber = await (baseManager as CasimirManager).getUserStake(address)
            const number = parseFloat(ethers.utils.formatEther(baseManagerBigNumber))
            const eigenManagerBigNumber = await (eigenManager as CasimirManager).getUserStake(address)
            const number2 = parseFloat(ethers.utils.formatEther(eigenManagerBigNumber))
            const total = number + number2
            return total
        } catch (err) {
            console.error(`There was an error in getUserStake function: ${JSON.stringify(err)}`)
            return 0
        }
    }

    async function getUserStakeDetails() {
        const result: Array<StakeDetails> = []
        const addresses = user.value?.accounts.map((account) => account.address) as Array<string>
    
        async function getUserStakeAndWithdrawable(manager: CasimirManager, address: string) {
            const userStake = await (manager as CasimirManager).getUserStake(address)
            const userStakeNumber = parseFloat(ethers.utils.formatEther(userStake))
            const availableToWithdraw = await (manager as CasimirManager).getWithdrawableBalance()
            const availableToWithdrawNumber = parseFloat(ethers.utils.formatEther(availableToWithdraw))
    
            return { userStakeNumber, availableToWithdrawNumber }
        }
    
        const promises = addresses.map(async (address) => {
            const [baseManagerData, /* eigenManagerData */] = await Promise.all([
                getUserStakeAndWithdrawable(baseManager, address),
                // getUserStakeAndWithdrawable(eigenManager, address),
            ])
    
            if (baseManagerData.userStakeNumber > 0) {
                result.push({
                    operatorType: "Default",
                    address,
                    amountStaked: baseManagerData.userStakeNumber,
                    availableToWithdraw: baseManagerData.availableToWithdrawNumber,
                })
            }
    
            // if (eigenManagerData.userStakeNumber > 0) {
            //     result.push({
            //         operatorType: "Eigen",
            //         address,
            //         amountStaked: eigenManagerData.userStakeNumber,
            //         availableToWithdraw: eigenManagerData.availableToWithdrawNumber,
            //     })
            // }
        })
    
        await Promise.all(promises)
        userStakeDetails.value = result
    }
    
    async function getWithdrawableBalance({ walletProvider, type }: { walletProvider: ProviderString, type: "default" | "eigen" }) {
        let signer
        if (browserProvidersList.includes(walletProvider)) {
            signer = getEthersBrowserSigner(walletProvider)
        } else if (walletProvider === "WalletConnect") {
            await getWalletConnectSigner()
        } else if (walletProvider === "Ledger") {
            getEthersLedgerSigner()
        } else if (walletProvider === "Trezor") {
            getEthersTrezorSigner()
        } else {
            throw new Error(`Invalid wallet provider: ${walletProvider}`)
        }
        const manager = type === "default" ? baseManager : eigenManager
        const managerSigner = (manager as CasimirManager).connect(signer as ethers.Signer)
        const withdrawableBalance = await managerSigner.getWithdrawableBalance()
        const withdrawableBalanceEther = ethers.utils.formatEther(withdrawableBalance)
        return withdrawableBalanceEther
    }

    async function withdraw({ amount, walletProvider, type }: { amount: string, walletProvider: ProviderString, type: "default" | "eigen" }) {
        try {
            stakeWithdrawError.value = ""
            // This is currently handling the connectWalletConnect if no current session
            const activeNetwork = await detectActiveNetwork(walletProvider)
            if (activeNetwork !== 5) {
                await switchEthersNetwork(walletProvider, "0x5")
                return window.location.reload()
            }
    
            let signer
            if (browserProvidersList.includes(walletProvider)) {
                signer = getEthersBrowserSigner(walletProvider)
            } else if (walletProvider === "WalletConnect") {
                await getWalletConnectSigner()
            } else if (walletProvider === "Ledger") {
                getEthersLedgerSigner()
            } else if (walletProvider === "Trezor") {
                getEthersTrezorSigner()
            } else {
                throw new Error(`Invalid wallet provider: ${walletProvider}`)
            }
            const manager = type === "default" ? baseManager : eigenManager
            const managerSigner = (manager as CasimirManager).connect(signer as ethers.Signer)
            const value = ethers.utils.parseEther(amount)
            awaitingStakeOrWithdrawConfirmation.value = true
            const result = await managerSigner.requestWithdrawal(value)
            const confirmation = await result.wait(1)
            if (confirmation) awaitingStakeOrWithdrawConfirmation.value = false
            return confirmation
        } catch (err: any) {
            console.error(`There was an error in withdraw function: ${JSON.stringify(err)}`)
            stakeWithdrawError.value = err.reason
            awaitingStakeOrWithdrawConfirmation.value = false
            return false
        }
    }

    return {
        awaitingStakeOrWithdrawConfirmation: readonly(awaitingStakeOrWithdrawConfirmation),
        stakeWithdrawError: readonly(stakeWithdrawError),
        stakingComposableInitialized,
        userStakeDetails,
        initializeStakingComposable,
        deposit,
        getDepositFees,
        getUserStake,
        getWithdrawableBalance,
        withdraw
    }
}