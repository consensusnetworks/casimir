import { onMounted, onUnmounted, readonly, ref } from 'vue'

const initializeComposable = ref(false)

const casimirRoadmapLocation = ref(2)

// Internal Testnet: beta version deployed and tested.
// Goerli Launch: public Goerli testnet launch
// Mainnet Beta: Mainnet launch with selected initial validator set
// Full Mainnet: permissionless validator launch
// Eigenlayer Restaking: integration with Eigenlayer to enable native restaking and eigenpod creation
// Liquid withdrawal pools: native ETH pool launched for users who want instant unstaking

const roadmapItems = ref([
    {
        step: 1,
        title: 'Internal Testnet',
        description: 'Deploy and test beta version.'
    },
    {
        step: 2,
        title: 'Goerli Launch',
        description: 'Launch publicly for Goerli Testnet.'
     },
    {
        step: 3,
        title: 'Mainnet Beta',
        description: 'Launch with Mainnet and selected validator set.'
    },
    {
        step: 4,
        title: 'Full Mainnet',
        description: 'Launch with permissionless validators on Mainnet.'
    },
    {
        step: 5,
        title: 'Eigenlayer Restaking',
        description: 'Integrate with Eigenlayer to enable native restaking and eigenpod creation. '
    },
    {
        step: 6,
        title: 'Liquid Withdrawl Pools',
        description: 'Launch with native ETH pools to allow users instant unstaking if desired.'
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