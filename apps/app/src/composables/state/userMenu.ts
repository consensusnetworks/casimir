import { 
    onMounted,
    onUnmounted,
    readonly,
    ref
} from "vue"


const initializeComposable = ref(false)

const userMenu = ref(false as boolean)
  
export default function useUserMenu() {
    const toggleUserMenu = (value: boolean) => {
        userMenu.value = value
    }
      
    onMounted(() => {
        if (!initializeComposable.value) {
            // 
            userMenu.value = false
        }
    })
    
    onUnmounted(() =>{
        // 
    })

    return {
        userMenu: readonly(userMenu),
        toggleUserMenu
    }
}