import { onMounted, onUnmounted, readonly, ref } from 'vue'

const initializeComposable = ref(false)

const screenWidth = ref(0)
const screenHeight = ref(0)
  
export default function useScreenDimentions() {

    const findScreenDimenstions = () => {
        try {
            screenWidth.value = window.innerWidth
            screenHeight.value = window.innerHeight 
        } catch (error) {
            console.log('Listening to screen dimentions error', error)
        }
    }
      
    onMounted(() => {
        if(!initializeComposable.value){
            console.log('listening to screen dimentions')
            findScreenDimenstions()
            window.addEventListener('resize', findScreenDimenstions)
            initializeComposable.value = true
        }
        
    })
    
    onUnmounted(() =>{
        window.removeEventListener('resize', findScreenDimenstions)
        initializeComposable.value = false
    })

    return {
        screenWidth: readonly(screenWidth),
        screenHeight: readonly(screenHeight)
    }
}