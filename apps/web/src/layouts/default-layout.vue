<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Carousel from '@/components/Carousel.vue'
import Slide from '@/components/Slide.vue'
import router from '@/composables/router'
import VueFeather from 'vue-feather'
import useFormat from '@/composables/format'
import useScreenDimensions from '@/composables/screenDimensions'
import useUser from '@/composables/user'
import { CryptoAddress, Currency, ProviderString } from '@casimir/types'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnect from '@/composables/walletConnectV2'

const { ethersProviderList, getEthersAddressWithBalance } = useEthers()
const { convertString, trimAndLowercaseAddress } = useFormat()
const { getLedgerAddress } = useLedger()
const { getTrezorAddress } = useTrezor()
const { screenWidth } = useScreenDimensions()
const { connectWalletConnectV2 } = useWalletConnect()

const activeWallets = [
  'MetaMask',
  'CoinbaseWallet',
  'WalletConnect',
  'Trezor',
  'Ledger',
  'TrustWallet',
  // 'IoPay',
] as ProviderString[]
const authFlowCardNumber = ref(1)
const selectedProvider = ref(null as ProviderString | null)
const openRouterMenu = ref(false)
const openWalletsModal = ref(false)
const walletProviderAddresses = ref([] as CryptoAddress[])

const {
  user,
  addAccountToUser,
  login,
  logout,
} = useUser()

function checkIfAddressIsUsed (account: CryptoAddress): boolean {
  const { address } = account
  if (user.value?.accounts) {
    const accountAddresses = user.value.accounts.map((account: any) => account.address)
    if (accountAddresses.includes(address)) return true
  }
  return false
}

  /**
   * Checks if user is adding an account or logging in
   * @param address 
  */
   async function selectAddress(address: string) {
    address = trimAndLowercaseAddress(address)
    if (user.value) {
      // Add account
      await addAccountToUser({provider: selectedProvider.value as ProviderString, address, currency: 'ETH'})
    } else {
      // Login
      await login({provider: selectedProvider.value as ProviderString, address, currency: 'ETH'})
    }
  }

/**
 * Sets the selected provider and returns the set of addresses available for the selected provider
 * @param provider 
 * @param currency 
*/
async function selectProvider(provider: ProviderString, currency: Currency = 'ETH'): Promise<void> {
  // console.clear()
  try {
    if (provider === 'WalletConnect') {
      walletProviderAddresses.value = await connectWalletConnectV2('5') as CryptoAddress[]
    } else if (ethersProviderList.includes(provider)) {
      walletProviderAddresses.value = await getEthersAddressWithBalance(provider) as CryptoAddress[]
    } else if (provider === 'Ledger') {
      walletProviderAddresses.value = await getLedgerAddress[currency]() as CryptoAddress[]
    } else if (provider === 'Trezor') {
      walletProviderAddresses.value = await getTrezorAddress[currency]() as CryptoAddress[]
    }
  } catch (error: any) {
    throw new Error(`Error selecting provider: ${error.message}`)
  }
}

const show_setting_modal = ref(false)

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
    if(openWalletsModal.value && connect_wallet_container.contains(event.target) && !connect_wallet_card.contains(event.target)) {
      openWalletsModal.value = false
      authFlowCardNumber.value = 1
    }
  }
}

const doesScrollBarExist = ref(true)

onMounted(() => {
  doesScrollBarExist.value =  document.documentElement.scrollHeight > document.documentElement.clientHeight

  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() =>{
  window.removeEventListener('click', handleOutsideClick)
})


</script>

<template>
  <div class="min-w-[360px]">
    <div :class="openWalletsModal? 'flex flex-col h-screen' : ''">
      <div
        class="px-[60px] 800s:px-[5%]  pt-[17px] pb-[19px] flex flex-wrap gap-[20px] justify-between items-center bg-black relative"
        :class="openWalletsModal && doesScrollBarExist? 'pr-[75px]' : ''"
      >
        <img
          src="/casimir.svg"
          alt="Casimir Logo"
          class="w-[21px]"
        >

        <div
          v-if="screenWidth >= 450"
          class="flex flex-wrap items-center gap-50 h-full "
        >
          <router-link
            to="/"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/'? 'nav_items_active' : ''"
          >
            Overview
          </router-link>
          <router-link
            to="/operator"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/operator'? 'nav_items_active' : ''"
          >
            Operator
          </router-link>
        </div>

        <div
          v-else
          class="nav_items nav_items_active relative "
        >
          <button
            class="flex items-center gap-[10px]"
            @click="openRouterMenu = true"
          >
            {{ router.currentRoute.value.fullPath === '/'? 'Overview' : router.currentRoute.value.fullPath === '/operator'? 'Operator' : router.currentRoute.value.fullPath }}
            <vue-feather
              type="chevron-down"
              class="icon w-[13px] h-min"
            />
          </button>

          <div
            v-if="openRouterMenu"
            class="absolute top-[160%] left-0 bg-white rounded-[3px] text-black pb-[15px]
            flex flex-col gap-[10px] z-[4]"
          >
            <div 
              class="flex items-center justify-between px-[15px] py-[5px] border-b"
            >
              Routes
              <button 
                @click="openRouterMenu = false"
              >
                <vue-feather
                  type="x"
                  class="icon w-[13px] mt-[3px] hover:text-grey_3"
                />
              </button>
            </div>
            <router-link
              to="/"
              class="flex items-center gap-[10px] px-[15px] py-[5px] hover:bg-grey_1"
              @click="openRouterMenu = false"
            >
              Overview

              <vue-feather
                type="chevron-right"
                class="icon w-[13px] h-min"
              />
            </router-link>
            <router-link
              to="/operator"
              class="flex items-center gap-[10px] px-[15px] py-[5px] hover:bg-grey_1"
              @click="openRouterMenu = false"
            >
              Operator

              <vue-feather
                type="chevron-right"
                class="icon w-[13px] h-min"
              />
            </router-link>
          </div>
        </div>

        <div class="flex items-center justify-between gap-[45px] 600s:gap-[10px] text-white h-[76px]">
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
              id="connect_wallet_button"
              class="connect_wallet flex justify-between items-center gap-[8px] whitespace-nowrap"
              @click="openWalletsModal = true"
            >
              Connect Wallet
            </button>
          </div>
        </div>

        <div
          v-show="show_setting_modal"
          id="setting_modal"
          class="absolute right-[60px] 800s:right-[5%] bg-white top-[80%] w-[200px] setting_modal"
        >
          <button class="border-b border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full h-[41px]">
            <vue-feather
              type="user"
              size="36"
              class="icon w-[17px] h-min"
            />
            
            <span>
              Account
            </span>
          </button>
          <!--<button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
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
          </button> -->
          <button
            class="border-t border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full h-[41px]"
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
        :class="openWalletsModal && doesScrollBarExist? 'overflow-hidden pr-[15px]' : ''"
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
      v-show="openWalletsModal"
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
                  @click="selectProvider(wallet, 'ETH'), authFlowCardNumber = 2, selectedProvider = wallet"
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
              <h6 class="nav_items flex items-center mb-[20px] h-[29px]">
                <button @click="authFlowCardNumber = 1, selectedProvider = null">
                  <vue-feather
                    type="chevron-left"
                    class="icon w-[20px] h-min text-primary hover:text-blue_3 mr-[10px] mt-[5px]"
                  />
                </button>
                Select Address
              </h6>
              <div
                v-if="walletProviderAddresses.length === 0"
                class="flex items-center justify-center h-[90%]"
              >
                <h6 class="nav_items">
                  Waiting on {{ selectedProvider }}...
                </h6>
              </div>
              <div v-else>
                <button
                  v-for="act in walletProviderAddresses"
                  :key="act.address"
                  class="w-full border rounded-[8px] px-[10px] py-[15px] flex flex-wrap gap-[10px] text-center items-center justify-between hover:border-blue_3 mb-[10px]"
                  :disable="checkIfAddressIsUsed(act)"
                  @click="selectAddress(act.address), openWalletsModal = false, authFlowCardNumber = 1"
                >
                  <div>
                    {{ convertString(act.address) }} 
                  </div>
                  <div>
                    {{ parseFloat(parseFloat(act.balance).toFixed(2)) }} ETH
                  </div>
                  <p
                    v-if="checkIfAddressIsUsed(act)"
                    class="text-decline text-[12px] font-[400]"
                  >
                    Address in use.
                  </p>
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

</style>@/composables/user