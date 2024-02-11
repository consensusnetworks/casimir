import { 
    onMounted,
    onUnmounted,
    readonly,
    ref
} from "vue"
import { useStorage } from "@vueuse/core"
import useToasts from "@/composables/state/toasts"

const {
    addToast,
    updateToast,
    removeToast
} = useToasts()


const initializeComposable = ref(false)

const stakingWalletAddress = ref(null as null | string)
const stakingAmount = ref(null as null | number)
const eigenLayerSelection = ref(false as boolean)

const withdrawAmount = ref(null as null | number)

const acceptTerms = ref(false)
  
export default function useStakingState() {
      
    onMounted(() => {
        if (!initializeComposable.value) {
            stakingWalletAddress.value = null
            stakingAmount.value = null
            eigenLayerSelection.value = false
            useStorage("acceptTerms", acceptTerms)
        }
    })
    
    onUnmounted(() =>{
        stakingWalletAddress.value = null
        stakingAmount.value = null
        eigenLayerSelection.value = false
    })

    const selectWallet = (address: string) => {
        stakingWalletAddress.value = address
    }


    const setAmountToStake = (amount: number) => {
        stakingAmount.value = amount
    }

    const toggleEigenlayerSelection = () => {
        eigenLayerSelection.value = !eigenLayerSelection.value
    }

    const toggleTerms = () => {
        acceptTerms.value = !acceptTerms.value
    }

    const setWithdrawAmount = (amount: number) => {
        withdrawAmount.value = amount
    }

    const getRandomToastId = (length: number) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        let result = ""
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return result
    }

    // TODO: hande stake and withdraw functions
    const handleStake = () => {
        let toastContent ={
            id: getRandomToastId(16),
            type: "loading",
            iconUrl: "",
            title: "Subbmitting Stake",
            subtitle: "Processing stake request",
            timed: false,
            loading: true
        }
        addToast(toastContent)

        setTimeout(() => {
            toastContent ={
                id: toastContent.id,
                type: "loading",
                iconUrl: "",
                title: "Confirming Stake",
                subtitle: "Confirming stake pool",
                timed: false,
                loading: true
            }
            updateToast(toastContent)

            setTimeout(() => {
                toastContent ={
                    id: toastContent.id,
                    type: "success",
                    iconUrl: "",
                    title: "Stake Finalized",
                    subtitle: "Stake is finalized and  no errors",
                    timed: false,
                    loading: false
                }
                updateToast(toastContent)
                setTimeout(() => {
                    removeToast(toastContent.id)
                }, 3000)
            }, 3000)
        }, 3000)

        // Add toast accordingly
        // handle stake here
        // submit stake
    }

    const handleWithdraw = () => {
        let toastContent ={
            id: getRandomToastId(16),
            type: "loading",
            iconUrl: "",
            title: "Withdrawing Stake",
            subtitle: "Processing stake withdraw request",
            timed: false,
            loading: true
        }
        addToast(toastContent)

        setTimeout(() => {
            toastContent ={
                id: toastContent.id,
                type: "loading",
                iconUrl: "",
                title: "Confirming Withdraw",
                subtitle: "Confirming stake withdraw from pool",
                timed: false,
                loading: true
            }
            updateToast(toastContent)

            setTimeout(() => {
                toastContent ={
                    id: toastContent.id,
                    type: "success",
                    iconUrl: "",
                    title: "Stake Withdraw Complete",
                    subtitle: "Stake withdraw is finalized and  no errors",
                    timed: false,
                    loading: false
                }
                updateToast(toastContent)
                setTimeout(() => {
                    removeToast(toastContent.id)
                }, 3000)
            }, 3000)
        }, 3000)

        // Add toast accordingly
        // handle stake here
        // submit stake
    }

    return {
        stakingWalletAddress: readonly(stakingWalletAddress),
        stakingAmount: readonly(stakingAmount),
        eigenLayerSelection: readonly(eigenLayerSelection),
        acceptTerms: readonly(acceptTerms),
        withdrawAmount: readonly(withdrawAmount),
        selectWallet,
        setAmountToStake,
        toggleEigenlayerSelection,
        toggleTerms,
        handleStake,
        setWithdrawAmount,
        handleWithdraw
    }
}