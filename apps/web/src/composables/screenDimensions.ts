import { onMounted, onUnmounted, readonly, ref } from "vue"


const initializeComposable = ref(false)

const screenWidth = ref(0)
const screenHeight = ref(0)
  
export default function useScreenDimensions() {

  const findScreenDimensions = () => {
    try {
      screenWidth.value = window.innerWidth
      screenHeight.value = window.innerHeight 
    } catch (error) {
      console.log("Listening to screen dimensions error", error)
    }
        
  }
      
  onMounted(() => {
    if(!initializeComposable.value){
      findScreenDimensions()
      window.addEventListener("resize", findScreenDimensions)
      initializeComposable.value = true
    }
        
  })
    
  onUnmounted(() =>{
    window.removeEventListener("resize", findScreenDimensions)
    initializeComposable.value = false
  })

  return {
    screenWidth: readonly(screenWidth),
    screenHeight: readonly(screenHeight)
  }
}