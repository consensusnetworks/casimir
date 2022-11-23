<script lang="ts" setup>
// To Do: Grab all staking info 
// balance, staked, reward info

import { ref, shallowRef, onBeforeMount, onMounted } from 'vue'

import ETHStaking from './components/ETHStaking.vue'

const selectedComponent = shallowRef(null)

const toggleModal = (component: any) => {
  selectedComponent.value = component
}

onMounted(() => {
  const modal = document.getElementById('staking_modal')
  window.onclick = function(event) {
    if (event.target === modal) {
      toggleModal(null)
    }
  }
})



</script>
<template>
  <div class="flex flex-col h-full w-full">
    <div
      v-show="selectedComponent"
      class="relative h-[0px]"
    >
      <div
        id="staking_modal"
        class="modal grid grid-cols-1 place-content-center p-[50px]"
      >
        <component
          :is="selectedComponent"
          :toggle-modal="toggleModal"
          class="modal-content"
        />
      </div>
    </div>
    
    <div>
      <h5 class="font-bold mb-[30px]">
        Casimir Staking
      </h5>
    </div>
    <!-- to do: put all of the css into classes -->
    <div class="grid grid-cols-1 place-content-center w-full h-full">
      <div class="border bordedr-[#E4E4E7] px-[25px] py-[50px] flex justify-between">
        <div class="flex">
          <img
            src="/ETH.svg"
            alt="eth icon"
            class="w-[50px] h-[50px] mr-[20px]"
          >
          <div class="flex flex-col justify-between  sr-only s_xsm:not-sr-only">
            <h6 class="font-bold">
              Ethereum Staking
            </h6>
            <h6 class="font-light">
              ETH
            </h6>
          </div>
        </div>
        
        <div class="flex flex-col justify-between sr-only s_sm:not-sr-only">
          <h6 class="font-medium">
            Balance
          </h6>
          <h6 class="font-medium text-grey_3">
            <!-- random -->
            46 ETH | $73816.89
          </h6>
        </div>
        <div class="flex flex-col justify-between sr-only s_md:not-sr-only">
          <h6 class="font-medium">
            Staked
          </h6>
          <h6 class="font-medium text-grey_3">
            <!-- random -->
            32 ETH | $51350.88
          </h6>
        </div>
        <div class="flex flex-col justify-between sr-only s_lg:not-sr-only">
          <h6 class="font-medium">
            Rewards
          </h6>
          <h6 class="font-medium text-grey_3">
            <!-- random -->
            6 ETH | $9628.29 | 3% AR
          </h6>
        </div>
        <div class="flex flex-col justify-between">
          <button
            class="btn_primary"
            @click="toggleModal(ETHStaking)"
          >
            Stake
          </button>
        </div>
      </div>
    </div>
  </div>
</template>