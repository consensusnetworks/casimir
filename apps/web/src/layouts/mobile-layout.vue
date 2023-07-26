<script lang="ts" setup>
import { ref, watch } from 'vue'
import VueFeather from 'vue-feather'

// import BreakdownChart from '@/pages/overview/components/BreakdownChart.vue'

// @Chris can we save this variable in storage for the user so on refresh they hop on the same view as the last
const activeView = ref('wallets')
// const slideAnimtaion = ref(false)

// watch(activeView, () => {
//     slideAnimtaion.value = true 
//     setTimeout(() => {
//         slideAnimtaion.value = false
//     }, 500)
// })
</script>

<template>
  <div class="h-[100vh] w-[100vw] min-w-[360px]">
    <div class="flex flex-col h-full w-full relative">
      <div class="h-full w-full flex items-center justify-center absolute top-0 left-0 z-[1] bg-black">
        <img
          src="/casimir.svg"
          alt="Casimir Background Logo"
          class=""
        >
      </div>
      <div class="h-full w-full z-[2] overflow-hidden">
        <transition name="slide-up">
          <div
            v-if="activeView === 'wallets'"
            key="wallets"
            class="w-full h-full bg-blue-400"
          >
            {{ activeView }}
          </div>
          <div
            v-else-if="activeView === 'breakdown'"
            key="breakdown"
            class="w-full h-full bg-red-400"
          >
            {{ activeView }}
          </div>
        </transition>
      </div>

      <!-- Nav Bar -->
      <div class="h-[70px] w-full bg-black text-white flex justify-around items-center z-[3]">
        <button
          class="nav_item"
          :class="activeView === 'wallets'? 'text-white' : 'text-[#898a8c]'"
          @click="activeView = 'wallets'"
        >
          <vue-feather
            type="credit-card"
            class="icon w-[16px] h-min"
          />
          <span>Wallets</span>
        </button>

        <button
          class="nav_item"
          :class="activeView === 'breakdown'? 'text-white' : 'text-[#898a8c]'"
          @click="activeView = 'breakdown'"
        >
          <vue-feather
            type="layout"
            class="icon w-[16px] h-min"
          />
          <span>Breakdown</span>
        </button>

        <button
          class="nav_item"
          :class="activeView === 'stake'? 'text-white' : 'text-[#898a8c]'"
          @click="activeView = 'stake'"
        >
          <vue-feather
            type="download"
            class="icon w-[16px] h-min"
          />
          <span>Stake</span>
        </button>

        <button
          class="nav_item"
          :class="activeView === 'accounts'? 'text-white' : 'text-[#898a8c]'"
          @click="activeView = 'accounts'"
        >
          <vue-feather
            type="table"
            class="icon w-[16px] h-min"
          />
          <span>Accounts</span>
        </button>

        <button
          class="nav_item"
          :class="activeView === 'settings'? 'text-white' : 'text-[#898a8c]'"
          @click="activeView = 'settings'"
        >
          <vue-feather
            type="settings"
            class="icon w-[16px] h-min"
          />
          <span>Settings</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-to{
    transform: translateY(0%);
    transition: 0.3s ease-in;
}

.slide-up-enter-from{
    transform: translateY(100%);
}

.nav_item{
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    letter-spacing: 1px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
    align-items: center;
}
</style>