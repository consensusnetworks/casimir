import { 
    onMounted,
    onUnmounted,
    readonly,
    ref
} from "vue"


const initializeComposable = ref(false)

const toasts = ref(null as object[] | null)
  
export default function useToasts() {
    const addToast = (object: object) => {
        toasts.value.push(object)
    }

    const removeToast = (toastId: number) => {
        const index = toasts.value.findIndex((toast) => toast.id === toastId)

        if (index !== -1) {
            toasts.value.splice(index, 1)
        }
    }
      
    onMounted(() => {
        if (!initializeComposable.value) {
            // 
            toasts.value = []
        }
    })
    
    onUnmounted(() =>{
        // 
    })

    return {
        toasts: readonly(toasts),
        addToast,
        removeToast
    }
}