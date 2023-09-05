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
        title: 'Limited Goerli Launch',
        description: 'Deploy and test beta version.',
        projectedCompletionTime: 'Completed'

    },
    {
        step: 2,
        title: 'Public Goerli Launch',
        description: 'Launch publicly for Goerli Testnet. Coming Soon!!',
        projectedCompletionTime: 'Ongoing'
     },
    {
        step: 3,
        title: 'Limited Mainnet Launch',
        description: 'Launch with select operators on Mainnet.',
        projectedCompletionTime: 'Q3 2023'
    },
    {
        step: 4,
        title: 'Public Mainnet Launch',
        description: 'Launch with permissionless operators on Mainnet.',
        projectedCompletionTime: 'Q4 2023'
    },
    {
        step: 5,
        title: 'Eigenlayer Restaking',
        description: 'Offer stakers opt-in native restaking with EigenLayer.',
        projectedCompletionTime: 'Q1 2023'
    },
    {
        step: 6,
        title: 'Flexible Liquidity',
        description: 'Offer instant staking withdrawals with liquidity pool integration.',
        projectedCompletionTime: 'Q2 2024'
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