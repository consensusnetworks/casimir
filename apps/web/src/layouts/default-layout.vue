<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Carousel from '@/components/Carousel.vue'
import Slide from '@/components/Slide.vue'
import router from '@/composables/router'
import VueFeather from 'vue-feather'
import useWallet from '@/composables/wallet'
import useUser from '@/composables/users'

const authFlowCardNumber = ref(1)
const selectedProivder = ref(null as null | string)
const termsCheckbox = ref(true)

const  {
  activeWallets,
  userAddresses,
  logout,
  selectAddress,
  selectProvider,
} = useWallet()

const { user } = useUser()

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
      authFlowCardNumber.value = 1
    }
  }
}

const convertString = (inputString: string) => {
  if (inputString.length <= 4) {
    return inputString
  }

  var start = inputString.substring(0, 4)
  var end = inputString.substring(inputString.length - 4)
  var middle = '*'.repeat(4)

  return start + middle + end
}

onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() =>{
  window.removeEventListener('click', handleOutsideClick)
})


</script>

<template>
  <div class="min-w-[360px]">
    <div :class="openWalletConnect? 'flex flex-col h-screen' : ''">
      <div
        class=" px-[60px] pt-[17px] pb-[19px] flex flex-wrap gap-[20px] justify-between items-center bg-black relative"
        :class="openWalletConnect? 'pr-[75px]' : ''"
      >
        <img
          src="/casimir.svg"
          alt="Casimir Logo"
          class="w-[21px]"
        >

        <div class="flex flex-wrap items-center gap-50 h-full pr-[50px]">
          <router-link
            to="/"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/'? 'nav_items_active' : ''"
          >
            Overview
          </router-link>
          <router-link
            to="/"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/staking'? 'nav_items_active' : ''"
          >
            Staking
          </router-link>
          <router-link
            to="/"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/exports'? 'nav_items_active' : ''"
          >
            Exports
          </router-link>
          <router-link
            to="/"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/resources'? 'nav_items_active' : ''"
          >
            Resources
          </router-link>
        </div>

        <div class="flex items-center justify-between gap-[45px] text-white">
          <button
            id="setting_modal_button"
          >
            <vue-feather
              type="settings"
              size="36"
              class="icon w-[19px] h-min"
            />
          </button>

          <div class="connect_wallet_gradient">
            <button
              class="connect_wallet flex justify-between items-center gap-[8px] whitespace-nowrap"
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
            <vue-feather
              type="user"
              size="36"
              class="icon w-[17px] h-min"
            />
            
            <span>
              Account
            </span>
          </button>
          <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <vue-feather
              type="layers"
              size="36"
              class="icon w-[17px] h-min"
            />
            <span>
              Chanelog
            </span>
          </button>
          <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <vue-feather
              type="help-circle"
              size="36"
              class="icon w-[17px] h-min"
            />
            <span>
              Support
            </span>
          </button>
          <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
            <vue-feather
              type="code"
              size="36"
              class="icon w-[17px] h-min"
            />
            <span>
              API
            </span>
          </button>
          <button
            class="border-t border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full"
            :disabled="!user"
            @click="logout"
          >
            <vue-feather
              type="log-out"
              size="36"
              class="icon w-[17px] h-min"
            />
            <span>
              Log out
            </span>
          </button>
        </div>
      </div>

      <div
        class="relative text-black"
        :class="openWalletConnect? 'overflow-hidden pr-[15px]' : ''"
      >
        <slot />
        <div
          class="bg-black h-[207px] w-full absolute top-0 left-0"
          style="z-index: -1;"
        />

        <div class="bg-black w-full h-[67px] mt-[160px]" />
      </div>
    </div>

    <div
      v-show="openWalletConnect"
      id="connect_wallet_container"
      class="w-full h-full bg-[#121212]/[0.23] fixed 
      z-[20] top-0 left-0 flex items-center justify-center"
    >
      <div 
        id="connect_wallet_card"
        class="800s:max-w-[80%] max-w-[580px] w-full flex max-h-[450px] h-full overflow-hidden"
      >
        <Carousel
          v-slot="{currentSlide}"
          :current-slide="authFlowCardNumber"
          class="w-full h-full relative overflow-hidden"
        >
          <Slide class="w-full h-full ">
            <div
              v-show="currentSlide === 1"
              class="absolute top-0 left-0 w-full h-full bg-white card px-[50px] py-[25px]"
            >
              <h6 class="nav_items">
                Select Provider
              </h6>
              <div class="flex flex-wrap justify-around gap-[20px] w-full mt-[20px]">
                <button
                  v-for="wallet in activeWallets"
                  :key="wallet"
                  class="w-[140px] h-[100px] border flex flex-col justify-center items-center rounded-[8px]"
                  @click="selectProvider(wallet, 'ETH'), authFlowCardNumber = 2, selectedProivder = wallet"
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
          </Slide>
          <Slide class="w-full h-full ">
            <div
              v-show="currentSlide === 2"
              class="absolute top-0 left-0 w-full h-full bg-white card px-[50px] py-[25px]"
            >
              <h6 class="nav_items flex items-center mb-[20px]">
                <button @click="authFlowCardNumber = 1, selectedProivder = null">
                  <vue-feather
                    type="chevron-left"
                    size=""
                    class="icon w-[20px] h-min text-primary hover:text-blue_3 mr-[10px] mt-[5px]"
                  />
                </button>
                Select Address
              </h6>
              <div
                v-if="userAddresses.length === 0"
                class="flex items-center justify-center h-[90%]"
              >
                <h6 class="nav_items">
                  Waiting on {{ selectedProivder }}...
                </h6>
              </div>
              <div v-else>
                <div class="my-[20px] px-[10px] nav_items">
                  <input
                    v-model="termsCheckbox"
                    type="checkbox"
                    class="mr-[5px]"
                  > By connecting my address, I certify that I have read and accept the updated 
                  <button class="text-primary hover:text-blue_3">
                    Terms of Service
                  </button>.
                </div> 
                <button
                  v-for="act in userAddresses"
                  :key="act.address"
                  class="w-full border rounded-[8px] px-[10px] py-[15px] flex items-center justify-between hover:border-blue_3"
                  @click="selectAddress(act.address), openWalletConnect = false, authFlowCardNumber = 1"
                >
                  <div>
                    {{ convertString(act.address) }}
                  </div>
                  <div>
                    {{ act.balance }} ETH
                  </div>
                </button>
              </div>
            </div>
          </Slide>
        </Carousel>
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
  color: #ABABAB;
}
.nav_items_active{
  color: #FFFFFF;
}
.card_input{
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 10px;

  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  letter-spacing: -0.01em;
  color: #101828;
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