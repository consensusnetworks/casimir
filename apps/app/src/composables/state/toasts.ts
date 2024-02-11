import { onMounted, onUnmounted, readonly, ref } from "vue"
import { useStorage } from "@vueuse/core"

interface Toast {
  id: string; // random for removing purposes
  type: string; // failed || success || loading || info
  iconUrl: string;
  title: string;
  subtitle: string;
  timed: boolean;
}

const initializeComposable = ref(false)

const toasts = ref([] as Toast[])

export default function useToasts() {
    const addToast = (t: Toast) => {
        toasts.value.push(t)
        if (t.timed) {
            setTimeout(() => {
                const index = toasts.value.indexOf(t)
                if (index !== -1) {
                    toasts.value.splice(index, 1)
                }
            }, 3000)
        }
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
                    addToast({
                        id: "test_net",
                        type: "info",
                        iconUrl: "/goerli.svg",
                        title: "Your are on Goerli Testnet",
                        subtitle: "Estimated time to mainnet is 12 days",
                        timed: true
                    })
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
