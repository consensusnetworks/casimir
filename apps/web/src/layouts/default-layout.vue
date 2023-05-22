<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

import useWallet from '@/composables/wallet'

const  {
  activeWallets
} = useWallet()

const show_setting_modal = ref(false)
const openWalletConnect = ref(false)

const handleOutsideClick = (event: any) => {
  const setting_modal = document.getElementById('setting_modal')
  const setting_modal_button = document.getElementById('setting_modal_button')
  if(setting_modal && setting_modal_button){
    if(show_setting_modal.value) {
      if(!setting_modal.contains(event.target)) {
        show_setting_modal.value = false
      }
    } else {
      if(setting_modal_button.contains(event.target)) {
        show_setting_modal.value = true
      }
    }
  }

  const connect_wallet_container = document.getElementById('connect_wallet_container')
  const connect_wallet_card = document.getElementById('connect_wallet_card')
  if(connect_wallet_container && connect_wallet_card){
    if(openWalletConnect.value && connect_wallet_container.contains(event.target) && !connect_wallet_card.contains(event.target)) {
      openWalletConnect.value = false
    }
  }
}



onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() =>{
  window.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div>
    <div>
      <div
        class="px-[60px] pt-[17px] pb-[19px] flex justify-between items-center bg-black relative"
      >
        <img
          src="/casimir.svg"
          alt="Casimir Logo"
          class="w-[21px]"
        >

        <div class="flex items-center gap-50 h-full">
          <router-link
            to="/"
            class="nav_items_active"
          >
            Overview
          </router-link>
          <router-link
            to="/"
            class="nav_items"
          >
            Staking
          </router-link>
          <router-link
            to="/"
            class="nav_items"
          >
            Exports
          </router-link>
          <router-link
            to="/"
            class="nav_items"
          >
            Resources
          </router-link>
        </div>

        <div class="flex items-center justify-between gap-[45px] text-white">
          <button
            id="setting_modal_button"
          >
            <i
              data-feather="settings"
              class="w-[19px] h-min"
            />
          </button>

          <div class="connect_wallet_gradient">
            <button
              class="connect_wallet flex justify-between items-center gap-[8px]"
              @click="openWalletConnect = true"
            >
              Connect Wallet
            </button>
          </div>
        </div>

        <div
          v-show="show_setting_modal"
          id="setting_modal"
          class="absolute right-[60px] bg-white top-[100%] w-[200px] setting_modal"
        >
          <button class="border-b border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <i
              data-feather="user"
              class="w-[17px] h-min"
            />
            <span>
              Account
            </span>
          </button>
          <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <i
              data-feather="layers"
              class="w-[17px] h-min"
            />
            <span>
              Chanelog
            </span>
          </button>
          <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <i
              data-feather="help-circle"
              class="w-[17px] h-min"
            />
            <span>
              Support
            </span>
          </button>
          <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <i
              data-feather="code"
              class="w-[17px] h-min"
            />
            <span>
              API
            </span>
          </button>
          <button class="border-t border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <i
              data-feather="log-out"
              class="w-[17px] h-min"
            />
            <span>
              Log out
            </span>
          </button>
        </div>
      </div>

      <div
        class="relative text-black"
        :class="openWalletConnect? 'overflow-hidden h-[90vh]' : 'overflow-auto'"
      >
        <slot style="z-index: 1;" />
        <div
          class="bg-black h-[207px] w-full absolute top-0 left-0"
          style="z-index: -1;"
        />

        <div class="bg-black w-full h-[67px] mt-[160px]" />
      </div>
    </div>

    <div
      v-if="openWalletConnect"
      id="connect_wallet_container"
      class="w-full h-full bg-[#121212]/[0.23] absolute 
      z-[20] top-0 left-0 flex items-center justify-center"
    >
      <div 
        id="connect_wallet_card"
        class="bg-white text-black card px-[40px] py-[25px] min-w-[300px] max-w-[500px] h-min"
      >
        <div class="nav_items">
          Connect Wallet
        </div>
        <div class="my-[20px] nav_items">
          <input
            type="checkbox"
            class="mb-10"
          > I certify that I have read and accept teh updated 
          <span class="text-primary"> Terms of Use </span> and <span class="text-primary">Privacy Notice</span>.
        </div>
        <div class="flex flex-wrap justify-between gap-[20px]">
          <button
            v-for="wallet in activeWallets"
            :key="wallet"
            class="w-[180px] h-[100px] border flex flex-col justify-center items-center rounded-[8px]"
          >
            <img
              :src="`/${wallet.toLowerCase()}.svg`"
              :alt="`${wallet} logo`"
              class="w-[32px] h-[32px] rounded-[999px] mb-[10px]"
            >
            <h6>
              {{ wallet }}
            </h6>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card{
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
  border-radius: 8px;
}
.setting_modal{
  background: #FFFFFF;
  border: 1px solid #F2F4F7;
  box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
  border-radius: 8px;
  z-index: 10;
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #344054;
}
.nav_items{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 13px;
  line-height: 17px;
  letter-spacing: -0.01em;
  height: 100%;

  color: #ABABAB;
}

/* .nav_items:hover{
  color: #FFFFFF;
  border-bottom: 1px solid #9BA4B5;
} */

.nav_items_active{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 13px;
  line-height: 17px;
  letter-spacing: -0.01em;
  height: 100%;

  color: #FFFFFF;
  /* border-bottom: 1px solid #9BA4B5; */
}
.connect_wallet_gradient{
  background: linear-gradient(101.44deg, rgba(23, 22, 22, 0.2) 9.24%, rgba(0, 0, 0, 0) 65.23%),
              linear-gradient(0deg, #484848, #484848),
              linear-gradient(298.92deg, rgba(131, 131, 131, 0.2) 7.46%, rgba(0, 0, 0, 0) 61.96%),
              linear-gradient(282.67deg, rgba(255, 252, 252, 0.2) -1.18%, rgba(0, 0, 0, 0.2) 55.48%);
  padding: 1px;
  border-radius: 8px;
}
.connect_wallet{
  padding: 0px 14px;
  filter: drop-shadow(0px 1px 2px rgba(16, 24, 40, 0.05));
  border-radius: 8px;
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #FFFFFF;
  background: black;
  height: 36px;
}

</style>