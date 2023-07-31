<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import VueFeather from 'vue-feather'
import MobileConnectWallets from '../components/mobileComponents/MobileConnectWallets.vue'
import MobileBreakdown from '../components/mobileComponents/MobileBreakdown.vue'
import MobileStake from '../components/mobileComponents/MobileStake.vue'
import MobileAccounts from '../components/mobileComponents/MobileAccounts.vue'
import MobileSetting from '../components/mobileComponents/MobileSetting.vue'

// import BreakdownChart from '@/pages/overview/components/BreakdownChart.vue'

// @Steve need a way to figure out how the user migrates through the app on connect wallet, add more wallets 
// @Chris can we save this variable in storage for the user so on refresh they hop on the same view as the one they were on
const activeView = ref('')

const mobileViews = ref({
    wallets: MobileConnectWallets,
    breakdown: MobileBreakdown,
    stake: MobileStake,
    accounts: MobileAccounts,
    settings: MobileSetting
})

onMounted(() => {
  setTimeout(() =>{
    activeView.value = 'wallets'
  }, 100)
})
</script>

<template>
  <!-- For mobile version we need to concider how the app behaves if it is on a mobile browser 
    -> search bar appears and disapears depending on the scrolling of the user 
    (currently have not found a way to see if the bar is there or not) -->
  <div
    class="w-[100%] min-w-[360px]"
  >
    <!-- Nav Bar -->
    <div class="h-[70px] w-full bg-black text-white flex justify-around items-center z-[3] sticky top-0 left-0 border-b border-b-grey_7">
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
    <!-- View -->
    <div
      class="z-[3] w-full"
      style="height: calc(100vh)"
    >
      <transition name="slide-up">
        <div
          :key="activeView"
          class="w-full h-full z-[2]"
        >
          <component
            :is="mobileViews[activeView]"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.slide-up-enter-to{
    transform: translateY(0%);
    transition: 0.3s ease-in;
}

.slide-up-enter-from{
    transform: translateY(-100%);
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