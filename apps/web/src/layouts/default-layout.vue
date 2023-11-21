<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue"
import router from "@/composables/router"
import VueFeather from "vue-feather"
import useAuth from "@/composables/auth"
import useFormat from "@/composables/format"
import useScreenDimensions from "@/composables/screenDimensions"
import useUser from "@/composables/user"
import useWallets from "@/composables/wallets"

import ConnectWalletsFlow from "@/components/ConnectWalletsFlow.vue"

const { logout } = useAuth()
const { convertString } = useFormat()
const { screenWidth } = useScreenDimensions()
const { user } = useUser()
const { detectInstalledWalletProviders } = useWallets()

const authFlowCardNumber = ref(1)
const openRouterMenu = ref(false)
const openWalletsModal = ref(false)

const show_setting_modal = ref(false)
const showUserAddressesModal = ref(false)

async function handleConnectWalletButtonClick() {
    openWalletsModal.value = true
    await detectInstalledWalletProviders()
}

const handleOutsideClick = (event: any) => {
    const setting_modal = document.getElementById("setting_modal")
    const setting_modal_button = document.getElementById("setting_modal_button")
    if (setting_modal && setting_modal_button) {
        if (show_setting_modal.value) {
            if (!setting_modal.contains(event.target)) {
                show_setting_modal.value = false
            }
        } else {
            if (setting_modal_button.contains(event.target)) {
                show_setting_modal.value = true
            }
        }
    }

    const connect_wallet_container = document.getElementById("connect_wallet_container")
    const connect_wallet_card = document.getElementById("connect_wallet_card")
    if (connect_wallet_container && connect_wallet_card) {
        if (openWalletsModal.value && connect_wallet_container.contains(event.target) && !connect_wallet_card.contains(event.target)) {
            openWalletsModal.value = false
            authFlowCardNumber.value = 1
        }
    }

    const user_addresses_modal = document.getElementById("user_addresses_modal")
    const connect_wallet_button = document.getElementById("connect_wallet_button")
    if (user_addresses_modal && connect_wallet_button) {
        if (showUserAddressesModal.value) {
            if (!user_addresses_modal.contains(event.target)) {
                showUserAddressesModal.value = false
            }
        } else {
            if (connect_wallet_button.contains(event.target)) {
                showUserAddressesModal.value = true
            }
        }
    }
}

const doesScrollBarExist = ref(true)

onMounted(() => {
    doesScrollBarExist.value = document.documentElement.scrollHeight > document.documentElement.clientHeight

    window.addEventListener("click", handleOutsideClick)
})

onUnmounted(() => {
    window.removeEventListener("click", handleOutsideClick)
})

const toggleModal = (showModal: boolean) => {
    openWalletsModal.value = showModal
}
</script>

<template>
  <div class="min-w-[360px]">
    <div :class="openWalletsModal ? 'flex flex-col h-screen' : ''">
      <div
        class="px-[60px] 800s:px-[5%]  pt-[17px] pb-[19px] flex flex-wrap gap-[20px] justify-between items-center bg-black relative"
        :class="openWalletsModal && doesScrollBarExist ? 'pr-[75px]' : ''"
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
            :class="router.currentRoute.value.fullPath === '/' ? 'nav_items_active' : ''"
          >
            Overview
          </router-link>
          <router-link
            to="/operator"
            class="nav_items"
            :class="router.currentRoute.value.fullPath === '/operator' ? 'nav_items_active' : ''"
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
            {{ router.currentRoute.value.fullPath === '/' ? 'Overview' : router.currentRoute.value.fullPath ===
              '/operator' ? 'Operator' : router.currentRoute.value.fullPath }}
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
            <div class="flex items-center justify-between px-[15px] py-[5px] border-b">
              Routes
              <button @click="openRouterMenu = false">
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
          <div class="cursor-default">
            Goerli Testnet
          </div>
          <div class="connect_wallet_gradient">
            <button
              id="connect_wallet_button"
              class="connect_wallet flex justify-between items-center gap-[8px] whitespace-nowrap"
            >
              <div
                v-if="!user"
                @click="handleConnectWalletButtonClick"
              >
                Connect Wallet
              </div>
              <div
                v-else
                class="flex align-middle items-center justify-center"
              >
                <div class="green_dot mr-8" />
                <img
                  :src="`${user.walletProvider.toLocaleLowerCase()}.svg`"
                  :alt="`${user.walletProvider.toLocaleLowerCase()} Icon`"
                  class="h-[26px] mr-6"
                > 
                <div>{{ convertString(user.address) }}</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Add address dropdown -->
        <div
          v-show="showUserAddressesModal && user"
          id="user_addresses_modal"
          class="absolute right-[60px] 800s:right-[5%] bg-white top-[80%] w-[200px] setting_modal"
        >
          <ul class="dropdown_list">
            <h6>
              Primary Account
            </h6>
            <li
              class="flex align-center items-center py-4 w-full cursor-default"
            >
              <img
                :src="`${user?.walletProvider.toLocaleLowerCase()}.svg`"
                :alt="`${user?.walletProvider.toLocaleLowerCase()} Icon`"
                class="h-[26px] mr-6"
              >
              <div class="ml-6">
                {{ user ? convertString(user?.address) : '' }}
              </div> 
            </li>
          </ul>
          <hr>
          <ul class="dropdown_list">
            <h6>
              Secondary Accounts
            </h6>
            <li 
              v-for="(account, index) in user?.accounts.filter((account) => account.address !== user?.address)"
              :key="index"
              class="flex align-center items-center py-4 w-full cursor-default"
            >
              <img
                :src="`${account.walletProvider.toLocaleLowerCase()}.svg`"
                :alt="`${account.walletProvider.toLocaleLowerCase()} Icon`"
                class="h-[26px] mr-6"
              >
              <div class="ml-6">
                {{ convertString(account.address) }}
              </div>
            </li>
            <li
              class="flex items-center justify-start gap-[8px] cursor-pointer w-full text-[#0d5fff]"
              @click="handleConnectWalletButtonClick"
            >
              <vue-feather
                type="plus"
                size="16"
                class="icon"
              />
              Add Account
            </li>
          </ul>
          <hr>
          <ul class="dropdown_list">
            <li
              class="flex items-center justify-start gap-[8px] w-full cursor-pointer"
              :disabled="!user"
              @click="logout"
            >
              <vue-feather
                type="log-out"
                size="16"
                class="icon"
              />
              <span>
                Log out
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="relative text-black"
        :class="openWalletsModal && doesScrollBarExist ? 'overflow-hidden pr-[15px]' : ''"
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
      <div id="connect_wallet_card">
        <ConnectWalletsFlow
          :toggle-modal="toggleModal"
          :open-wallets-modal="openWalletsModal"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* TODO: Make this global? */
body {
  scrollbar-gutter: stable both-edges;
}

.card {
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
  border-radius: 8px;
}

.setting_modal {
  background: #FFFFFF;
  /* border: 1px solid #F2F4F7; */
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

.nav_items {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 13px;
  line-height: 17px;
  letter-spacing: -0.01em;
  color: #ABABAB;
}

.nav_items_active {
  color: #FFFFFF;
}

.card_input {
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


.connect_wallet_gradient {
  background: linear-gradient(101.44deg, rgba(23, 22, 22, 0.2) 9.24%, rgba(0, 0, 0, 0) 65.23%),
    linear-gradient(0deg, #484848, #484848),
    linear-gradient(298.92deg, rgba(131, 131, 131, 0.2) 7.46%, rgba(0, 0, 0, 0) 61.96%),
    linear-gradient(282.67deg, rgba(255, 252, 252, 0.2) -1.18%, rgba(0, 0, 0, 0.2) 55.48%);
  padding: 1px;
  border-radius: 8px;
}

.connect_wallet {
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

/* Should reflect these tailwind sytles: class="border-t border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-fbuttonl h-[41px]" */
.dropdown_list {
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  gap: 12px;
  width: 100%;
  margin-top: 2px;
  margin-bottom: 2px;
}
.green_dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #29a329;
}
</style>