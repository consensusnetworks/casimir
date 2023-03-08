<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import router from '@/composables/router'

// TD: connect this to actual staking rewards for the user
const selectedIndex = ref(-1)
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
const toggleCard = ref(true)
onMounted(() =>{

  selectedIndex.value = 0
  toggleCard.value = true
  setTimeout(()=>{toggleCard.value = false}, 2000)
  setTimeout(() => {
    selectedIndex.value = 1
    toggleCard.value = true
    // setTimeout(()=>{toggleCard.value = false}, 2000)
  }, 3000)
    
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
    //         selectedIndex.value = '!carousel_slider_item_'+index
    //         aTag = document.getElementById('id_'+selectedIndex.value)

    //         if(aTag) aTag.click()

    //         let nexIndex = (index + 1) === dummy_staked_data.value.length? 0 : (index + 1)
            
    //         index = nexIndex
    //     }, 3000)
    // }
})


</script>
  
<template>
  <div class="flex flex-col gap-10 overflow-hidden w-full">
    <h6 class="font-medium text-grey_8 mb-10">
      Staking Breakdown
    </h6>
    <div class="h-full flex w-full">
      <div
        v-for="(item, i) in dummy_staked_data"
        v-show="selectedIndex === i"
        :key="i"
        class="h-full w-full relative"
      >
        <div
          class="absolute w-full h-full flex flex-col justify-around border"
          :class="toggleCard? 'card_enter' : 'card_leave left-[-100%]'"
        >
          <div class="flex flex-col gap-10 items-center justify-center">
            <img
              :src="'/'+ item.tokenStaked +'.svg'"
              :alt="item.tokenStaked + ' Logo'"
              class="h-50 w-50"
            >
            <div>
              <span class="text-body text-grey_5 font-bold">
                {{ item.description }}
              </span>
            </div>
          </div>
          <div class="flex justify-around items-center">
            <div class="text-center">
              <h4 class="font-bold text-blue_3">
                {{ item.totalStaked }}
              </h4>
              <span class="text-body text-grey_5 font-bold">{{ item.tokenStaked }} Staked </span>
            </div>
            <div class="text-center">
              <h4 class="font-bold text-blue_3">
                {{ item.totalAccumulatedRewards }}
              </h4>
              <span class="text-body text-grey_5 font-bold">{{ item.tokenStaked }} Claimable </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    
    <div class="flex flex-wrap items-center justify-end w-full gap-10">
      <button 
        v-for="(item, i) in dummy_staked_data"
        :key="i"
        class="w-15 h-15 rounded-[20px]"
        :class="selectedIndex === i? 'bg-primary':'bg-blue_3'"
      />
    </div>
  </div>
</template>

<style scoped>

.card{
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: antiquewhite;
}
.card_enter{
  /* right: -100%; */
  animation: enter 0.5s linear;
  -webkit-animation: linear;
  animation-name: enter;
  -webkit-animation-name: enter;
  animation-duration: 0.5s;
  -webkit-animation-duration: 0.5s;
}
@keyframes enter {
  0% {
    right: -100%;
  }
  100% {
    right: 0%;
  }
}

.card_leave{
  /* right: -100%; */
  animation: leave 0.5s linear;
  -webkit-animation: linear;
  animation-name: leave;
  -webkit-animation-name: leave;
  animation-duration: 0.5s;
  -webkit-animation-duration: 0.5s;
}
@keyframes leave {
  0% {
    left: 0%;
  }
  100% {
    left: -100%;
  }
}
</style>