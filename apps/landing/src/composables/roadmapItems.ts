import { onMounted, onUnmounted, readonly, ref } from 'vue'

const initializeComposable = ref(false)

const casimirRoadmapLocation = ref(2)

const roadmapItems = ref([
    {
        step: 1,
        title: 'Internal Testnet',
        description: ''
    },
    {
        step: 2,
        title: 'Goerli Launch',
        description: ''
     },
    {
        step: 3,
        title: 'Mainnet Beta',
        description: ''
    },
    {
        step: 4,
        title: 'Full Mainnet',
        description: ''
    },
    {
        step: 5,
        title: 'Eigenlayer Restaking',
        description: ''
    },
    {
        step: 6,
        title: 'Liquid Withdrawl Pools',
        description: ''
    },
])

  
export default function useRoadmap() {
    onMounted(() => {
        if(!initializeComposable.value){
            initializeComposable.value = true
        }
        
    })
    
    onUnmounted(() =>{
        initializeComposable.value = false
    })

    return {
        roadmapItems: readonly(roadmapItems),
        casimirRoadmapLocation: readonly(casimirRoadmapLocation),
    }
}