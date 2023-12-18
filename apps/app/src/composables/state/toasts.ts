import { onMounted, onUnmounted, readonly, ref } from "vue"
import { useStorage } from "@vueuse/core"

interface Toast {
  id: string; // random for removing purposes
  type: string; // failed || success || loading || info
  iconUrl: string;
  title: string;
  subtitle: string;
}

const initializeComposable = ref(false)

const toasts = ref([] as Toast[])

export default function useToasts() {
    const addToast = (t: Toast) => {
        toasts.value.push(t)
    }

    const removeToast = (toastId: string) => {
        const updatedToasts = toasts.value.filter((toast) => toast.id !== toastId)
        toasts.value = updatedToasts
    }

    onMounted(() => {
        if (!initializeComposable.value) {
            initializeComposable.value = true 
            toasts.value = []

            const showCurrentNetwork = ref(false)
            const showCurrentNetworkStorage = useStorage(
                "showCurrentNetwork",
                showCurrentNetwork
            )

            setTimeout(() => {
                if (!showCurrentNetworkStorage.value) {
                    toasts.value.push({
                        id: "test_net",
                        type: "info",
                        iconUrl: "/goerli.svg",
                        title: "Your are on Goerli Testnet",
                        subtitle: "Estimated time to mainnet is 12 days",
                    } as Toast)
                }
            }, 800)
        }
    })

    onUnmounted(() => {
    // Clean-up logic if needed
    })

    return {
        toasts: readonly(toasts),
        addToast,
        removeToast,
    }
}
