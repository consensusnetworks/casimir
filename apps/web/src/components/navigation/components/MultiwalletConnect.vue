
<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'

import useWallet from '@/composables/wallet'
import useUsers from '@/composables/users'

const { user } = useUsers()
const {
  connectWallet,
} = useWallet()

const hideInfo = ref(false)

const hasWallets = ref(false)

const checkForWallets = () =>{
  if(!user.value) { hasWallets.value = false } else {hasWallets.value = true}
}

watch(user, () => {
  checkForWallets()
})

onMounted(()=>{
  checkForWallets()
})

const addWalletAddress = ref('')

const copyWalletAddress = (text: string) => {
  navigator.clipboard.writeText(text)
}
</script>
  
<template>
  <div class="h-full w-full">
    <div
      class="multi_wallet_container gap-15"
      style="height: calc(100% - 50px)"
      :class="hasWallets? '':'reverse_multi_wallet_container'"
    >
      <div class="w-full h-full overflow-auto">
        <div class="flex flex-col gap-15 pb-20 pr-20">
          <!-- TD: make alerts for Metamask and others to remind them to have that account connected when connecting -->
          <!-- Only show when a user is connected -->
          <div
            v-if="hasWallets"
            class="supported_wallet_box flex gap-15"
          >
            <input
              v-model="addWalletAddress"
              type="text"
              placeholder="Add wallet by address"
              class="outline-none w-full truncate"
            >
            <button 
              class="iconoir-cancel text-[20px] 
            px-2 py-2 "
              @click="addWalletAddress = ''"
            />
            <div class="w-1 h-full bg-grey_3" />
            <!-- TD: @Chris add a way for a user to connect wallet by address -->
            <button 
              class="iconoir-arrow-right text-[24px] hover:bg-blue_3
            px-2 py-2 rounded-[25px] hover:text-white "
            />
          </div>
          <button
            class="supported_wallet_box relative"
            @click="connectWallet('MetaMask')"
          >
            <img
              src="/metamask.svg"
              alt=""
            >
          
            <h6 class="sr-only s_md:not-sr-only">
              Metamask
            </h6>

            <h6 class="s_md:sr-only not-sr-only">
              M
            </h6>
          </button>
          <button
            class="supported_wallet_box"
            @click="connectWallet('WalletConnect')"
          >
            <div class="flex items-center gap-15">
              <img
                src="/walletconnect.svg"
                alt=""
              > 
              <span 
                class="text-body font-bold text-grey_3 sr-only s_md:not-sr-only"
              >
                Ethereum only
              </span>
            </div>
            <h6 class="sr-only s_md:not-sr-only">
              Wallet Connect
            </h6>
            <h6 class="s_md:sr-only not-sr-only">
              WC
            </h6>
          </button>
          <button
            class="supported_wallet_box"
            @click="connectWallet('CoinbaseWallet')"
          >
            <img
              src="/coinbase.svg"
              alt=""
            >
            <h6 class="sr-only s_md:not-sr-only">
              Coinbase
            </h6>
            <h6 class="s_md:sr-only not-sr-only">
              C
            </h6>
          </button>
          <!-- TD: Add modal to this for selecting which act they want to conenct with -->
          <button
            class="supported_wallet_box"
            @click="connectWallet('Ledger')"
          >
            <img
              src="/ledger.svg"
              alt=""
            >
            <h6 class="sr-only s_md:not-sr-only">
              Ledger
            </h6>
            <h6 class="s_md:sr-only not-sr-only">
              L
            </h6>
          </button>
          <button
            class="supported_wallet_box"
            @click="connectWallet('IoPay')"
          >
            <img
              src="/IOTX.svg"
              alt=""
            >
            <h6 class="sr-only s_md:not-sr-only">
              IoPay
            </h6>
            <h6 class="s_md:sr-only not-sr-only">
              IP
            </h6>
          </button>
          <button
            class="supported_wallet_box"
            @click="connectWallet('Phantom')"
          >
            <img
              src="/phantom.svg"
              alt=""
            >
            <h6 class="sr-only s_md:not-sr-only">
              Phantom
            </h6>
            <h6 class="s_md:sr-only not-sr-only">
              PH
            </h6>
          </button>
          <!-- TD: Add keplr once implemented by @chris -->
          <button
            class="supported_wallet_box opacity-50"
            disabled
          >
            <img
              src="/keplr.svg"
              alt=""
            >
            <h6 class="sr-only s_md:not-sr-only">
              Keplr
            </h6>
            <h6 class="s_md:sr-only not-sr-only">
              K
            </h6>
          </button>
          <button
            class="supported_wallet_box"
            @click="connectWallet('Trezor')"
          >
            <img
              src="/trezor.svg"
              alt=""
            >
            <h6 class="sr-only s_md:not-sr-only">
              Trezor
            </h6>

            <h6 class="s_md:sr-only not-sr-only">
              T
            </h6>
          </button>
        </div>
      </div>
      <div class="w-full h-full overflow-auto">
        <div
          v-if="hasWallets"
          class="w-full flex flex-col items-center gap-15 "
        >
          <div class="w-[95%] flex justify-end items-center gap-25">
            <span class="text-body text-grey_3">
              Hide Wallets
            </span>
            <button 
              class="toggle"
              :class="hideInfo? 'border border-primary justify-end':''"
              @click="hideInfo = !hideInfo"
            >
              <div
                class="toggle_center"
                :class="hideInfo? 'bg-primary':''"
              />
            </button>
            <button
              class="btn_primary font-bold px-10 py-6 whitespace-nowrap"
            >
              Disconnect Account
            </button>
          </div>
          <!-- <div
            v-for="(item, i) in user.accounts"
            :key="i"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                :src="'/'+ i.toLowerCase() + '.svg'"
                :alt="i + 'Icon'"
              >
              <h6 class="flex items-center gap-15">
                {{ i }}
              </h6>
            </div>
            <div v-if="!hideInfo">
              <div
                v-for="(account, index) in item"
                :key="account"
                class="flex gap-15 justify-between items-center mb-15"
              >
                <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                  {{ i }} {{ index + 1 }}
                </span>
                <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                  {{ index + 1 }}
                </span>
                <span class="flex gap-5 items-center text-grey_3 truncate">
                  <span class="max-w-[400px] truncate">
                    {{ account.address }}
                  </span>
                  <button
                    class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                    @click="copyWalletAddress(account)"
                  />
                </span>
              </div>
            </div>
          </div> -->
        </div>
        <div
          v-else
          class="w-full border h-full flex flex-col items-center justify-center gap-15"
        >
          <h6 class="text-grey_2 font-medium">
            No Wallets Connected
          </h6>
        </div>
      </div>
    </div>
  </div>
</template>