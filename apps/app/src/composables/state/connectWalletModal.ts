import { 
    onMounted,
    onUnmounted,
    readonly,
    ref
} from "vue"


const initializeComposable = ref(false)

const openConnectWalletModal = ref(null as boolean | null)
  
export default function useConnectWalletModal() {
    const toggleConnectWalletModal = (value: boolean) => {
        openConnectWalletModal.value = value
    }
      
    onMounted(() => {
        if (!initializeComposable.value) {
            // 
            openConnectWalletModal.value = false
        }
    })
    
    onUnmounted(() =>{
        // 
    })

    return {
        openConnectWalletModal: readonly(openConnectWalletModal),
        toggleConnectWalletModal
    }
}