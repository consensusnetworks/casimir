<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import router from '@/composables/router'

// TD: connect this to actual staking rewards for the user
const selectedItem = ref(null as string | null)
const dummy_staked_data = ref([
    {
        tokenStaked: 'ETH',
        description: 'Ethereum Staking',
        totalStaked: '25',
        totalAccumulatedRewards: '28',
        walletsStakedFrom: [
            {
                provider: 'MetaMask',
                address: '0x345678987654567890876567890987657890876789',
                ammountStaked: '12.5',
                accumulatedRewards: '14',
                stakedTo: 'SSV'
                // Possible other pool information
            },
            {
                provider: 'CoinbaseWallet',
                address: '0x345678987654567890876567890987657890876789',
                ammountStaked: '12.5',
                accumulatedRewards: '14',
                stakedTo: 'SSV'
                // Possible other pool information
            },
        ]
    },
    {
        tokenStaked: 'IOTX',
        description: 'IoTeX Staking',
        totalStaked: '12.5',
        totalAccumulatedRewards: '14',
        walletsStakedFrom: [
            {
                provider: 'MetaMask',
                address: '0x345678987654567890876567890987657890876789',
                ammountStaked: '12.5',
                accumulatedRewards: '14',
                stakedTo: 'IoPay'
                // Possible other pool information
            }
        ]
    }
])

onMounted(() =>{
    
    // TD: fix bug: the component gets mounted in /fron-page view...
    // TD: Fix issue: when staking item is transitioned to the entire page is shifted to it 
    // if(
    //     dummy_staked_data.value.length > 0 
    //     && 
    //     router.currentRoute.value.fullPath != '/connect-wallet'
    // ){
    //     let index = 0
    //     let aTag
    //     setInterval(() => {
    //         selectedItem.value = '!carousel_slider_item_'+index
    //         aTag = document.getElementById('id_'+selectedItem.value)

    //         if(aTag) aTag.click()

    //         let nexIndex = (index + 1) === dummy_staked_data.value.length? 0 : (index + 1)
            
    //         index = nexIndex
    //     }, 3000)
    // }
})
</script>
  
<template>
  <div class="flex flex-col gap-10 overflow-auto w-full">
    <h6 class="font-medium text-grey_8 mb-10">
      Staking Breakdown
    </h6>
    
    <section
      v-if="dummy_staked_data.length > 0"
      class="carousel_container"
    >
      <div class="carousel_slider">
        <div
          v-for="(item, i) in dummy_staked_data"
          :id="'!carousel_slider_item_'+i"
          :key="i"
          class="carousel_slider_item py-15 px-10"
        >
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex flex-col items-center justify-center">
              <img
                :src="'/'+ item.tokenStaked +'.svg'"
                :alt="item.tokenStaked + ' Logo'"
                class="h-25 w-25"
              >
              <div>
                <span class="text-body font-bold">
                  {{ item.description }}
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-10 items-center justify-center">
              <div>
                <span class="text-body font-bold text-grey_5">
                  Currently Staking From
                </span>
              </div>
              <div class="flex gap-10">
                <div
                  v-for="(provider, index) in item.walletsStakedFrom"
                  :key="index"
                >
                  <img
                    :src="'/'+ provider.provider.toLowerCase() +'.svg'"
                    :alt="provider.provider + ' Logo'"
                    class="h-20 w-20"
                  >
                </div>
              </div>
            </div>
            <div class="flex items-center justify-around w-full">
              <div>
                <h6 class="text-body font-bold mb-10">
                  {{ item.tokenStaked }} Staked
                </h6>
                <h5 class="font-bold text-blue_5">
                  {{ item.totalStaked }} 
                </h5>
              </div>
              <div>
                <h6 class="text-body font-bold mb-10">
                  Claimable {{ item.tokenStaked }} 
                </h6>
                <h5 class="font-bold text-blue_5">
                  {{ item.totalAccumulatedRewards }} 
                </h5>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-5 mt-15 items-center">
        <a 
          v-for="(item, i) in dummy_staked_data"
          :id="'id_!carousel_slider_item_'+i"
          :key="i"
          style="text-decoration: none;"

          :href="'#!carousel_slider_item_'+i"
          class="h-15 w-15 rounded-[50px] cursor-pointer
          hover:bg-primary"
          :class="selectedItem === '#!carousel_slider_item_'+i? 'bg-primary': 'bg-blue_3'"
          @click="selectedItem = '#!carousel_slider_item_'+i"
        />
      </div>
    </section>
    <section
      v-else
      class="w-full h-full flex justify-center items-center 
      text-body text-grey_3 font-bold border border-dashed"
    >
      You currently do not have any staked items
    </section>
  </div>
</template>