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
          class="border border-grey px-[25px] py-[50px] flex justify-between"
        >
          <div class="flex">
            <div class="tooltip">
              <img
                src="/ETH.svg"
                alt="eth icon"
                class="w-[50px] h-[50px] mr-[20px]"
              >
              <span class="tooltiptext text-body font-bold">
                Ethereum Icon
              </span>
            </div>
            
            <div class="flex flex-col justify-between  sr-only s_xsm:not-sr-only">
              <h6 class="font-bold">
                Ethereum Staking
              </h6>
              <h6 class="font-light">
                ETH
              </h6>
            </div>
          </div>
          <div class="tooltip">
            <div class="flex flex-col justify-between gap-[15px] sr-only s_sm:not-sr-only">
              <h6 class="font-medium">
                Unstaked ETH
              </h6>
              <h6 class="font-medium text-grey_3">
                <!-- random -->
                46 ETH | $73816.89
              </h6>
            </div>
            <span class="tooltiptext text-body font-bold">
              Avaliable ETH: Collection of all connected wallets
            </span>
          </div>
          
          <div class="tooltip">
            <div class="flex flex-col justify-between sr-only gap-[15px] s_md:not-sr-only">
              <h6 class="font-medium">
                Staked
              </h6>
              <h6 class="font-medium text-grey_3">
                <!-- random -->
                32 ETH | $51350.88
              </h6>
            </div>
            <span class="tooltiptext text-body font-bold">
              ETH Staked: Collection of all connected wallets
            </span>
          </div>
          
          <div class="tooltip">
            <div class="flex flex-col justify-between gap-[15px] sr-only s_lg:not-sr-only">
              <h6 class="font-medium">
                In Rewards
              </h6>
              <h6 class="font-medium text-grey_3">
                <!-- random -->
                6 ETH | $9628.29 | 3% AR
              </h6>
            </div>
            <span class="tooltiptext text-body font-bold">
              ETH Rewards From Staking: Collection of all connected wallets staked to SSVs
            </span>
          </div>
          
          <div class="flex flex-col justify-between">
            <RouterLink to="Staking/ETH">
              <button
                class="btn_primary xsm:px-[6px]"
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