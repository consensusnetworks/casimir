import { 
    onMounted,
    onUnmounted,
    readonly,
    ref
} from "vue"


const initializeComposable = ref(false)

const navMenuStatus = ref(null as boolean | null)
  
export default function useNavMenu() {
    const toggleNavMenu = (value: boolean) => {
        navMenuStatus.value = value
    }
      
    onMounted(() => {
        if (!initializeComposable.value) {
            // 
            navMenuStatus.value = false
        }
    })
    
    onUnmounted(() =>{
        // 
    })

    return {
        navMenuStatus: readonly(navMenuStatus),
        toggleNavMenu
    }
}