<script lang="ts" setup>
// To Do: Grab all staking info 
// balance, staked, reward info

import router from '@/composables/router'
import { ref, shallowRef, onBeforeMount, onMounted, watch } from 'vue'

import StakingModal from './components/StakingModal.vue'

const selectedComponent = shallowRef(null)

const toggleModal = (component: any) => {
  selectedComponent.value = component
}

onMounted(() => {
  if( router.currentRoute.value.fullPath.split('/').length > 2 ) {
    toggleModal(StakingModal)
  } else {
    toggleModal(null)
  }
  const modal = document.getElementById('staking_modal')
  window.onclick = function(event) {
    if (event.target === modal) {
      toggleModal(null)
      router.push('/Staking')
    }
  }
})

watch(router.currentRoute,  () => {
  if( router.currentRoute.value.fullPath.split('/').length > 2 ) {
    toggleModal(StakingModal)
  } else {
    toggleModal(null)
  }
})

</script>
<template>
  <div class="h-full">
    <div class="mb-[20px]">
      <h5 class="font-bold whitespace-nowrap">
        Casimir Staking
      </h5>
    </div>
    <div
      :style="{height: 'calc(100% - 55px)'}"
    >
      <div class="h-full">
        <component
          :is="selectedComponent"
          v-if="selectedComponent"
          :toggle-modal="toggleModal"
        >
          <RouterView />
        </component>
        <div
          v-else
          class="border bordedr-[#E4E4E7] px-[25px] py-[50px] flex justify-between"
        >
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
              Unstaked ETH
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
              In Rewards
            </h6>
            <h6 class="font-medium text-grey_3">
              <!-- random -->
              6 ETH | $9628.29 | 3% AR
            </h6>
          </div>
          <div class="flex flex-col justify-between">
            <RouterLink to="Staking/ETH">
              <button
                class="btn_primary"
                @click="toggleModal(StakingModal)"
              >
                Stake
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>