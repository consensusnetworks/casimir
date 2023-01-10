
<script lang="ts" setup>
import { ref, watch,onMounted } from 'vue'

import useWallet from '@/composables/wallet'
import useUsers from '@/composables/users'

const { addAccount, removeAccount, user } = useUsers()
const {
  selectedProvider,
  selectedAccount,
  toAddress,
  amount,
  amountToStake,
  pools,
  connectWallet,
  sendTransaction,
  signMessage,
  deposit,
  login,
  getUserPools
} = useWallet()

const hideInfo = ref(false)

const hasWallets = ref(false)

const checkForWallets = () =>{
  if(!user.value.accounts){
    hasWallets.value = false
    return
  }
  if(
    user.value.accounts.CoinbaseWallet ||
    user.value.accounts.IoPay ||
    user.value.accounts.Ledger ||
    user.value.accounts.MetaMask ||
    user.value.accounts.Phantom ||
    user.value.accounts.Trezor ||
    user.value.accounts.WalletConnect 
  ){
    hasWallets.value = true
  }
}

watch(user, () => {
  checkForWallets()
})

onMounted(()=>{
  checkForWallets()
})

const copyWalletAddress = (text) => {
  navigator.clipboard.writeText(text)
}
</script>
  
<template>
  <div class="">
    <h6 class="text-grey_5 font-medium">
      Connect your wallets to view and access all of your assets in one location
    </h6>
    <div class="pb-20 mt-25 grid grid-cols-3">
      <div 
        :class="hasWallets? 'col-span-1':'col-span-2'"
        class="flex flex-col gap-15 h-[500px] overflow-auto"
      >
        <button class="supported_wallet_box">
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
        <button class="supported_wallet_box">
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
        <button class="supported_wallet_box">
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
        <button class="supported_wallet_box">
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
        <button class="supported_wallet_box">
          <img
            src="/iopay.svg"
            alt=""
          >
          <h6 class="sr-only s_md:not-sr-only">
            IoPay
          </h6>
          <h6 class="s_md:sr-only not-sr-only">
            IP
          </h6>
        </button>
        <button class="supported_wallet_box">
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
        <button
          class="supported_wallet_box opacity-[0.5]"
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
        <button class="supported_wallet_box">
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
      <div
        v-if="!hasWallets"
        :class="hasWallets? 'col-span-2':'col-span-1'"
        class="border-l border-l-grey_2 h-full flex justify-center items-center"
      >
        <h6 class="text-grey_2 font-medium">
          No Wallets Connected
        </h6>
      </div>
      <div
        v-else
        :class="hasWallets? 'col-span-2':'col-span-1'"
        class="border-l border-l-grey_2 overflow-auto h-[500px]"
      >
        <div class="flex w-full justify-end items-center gap-15 mb-15 px-[2.5%]">
          <span class="text-body text-grey_3">
            Hide Wallets
          </span>
          <div 
            class="toggle"
            :class="hideInfo? 'border-primary justify-end':''"
            @click="hideInfo = !hideInfo"
          >
            <div
              class="toggle_center"
              :class="hideInfo? 'bg-primary':''"
            />
          </div>
        </div>
        <div 
          v-if="user.accounts.MetaMask"
          class="connected_wallets_card"
        >
          <div class="flex justify-between items-center mb-15">
            <img
              src="/metamask.svg"
              alt="MetaMask Icon"
            >
            <h6 class="flex items-center gap-15">
              Metamask
              <span
                class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
              >
                {{ user.accounts.MetaMask.length }}
              </span>
            </h6>
          </div>
          <div v-if="!hideInfo">
            <div
              v-for="(account, index) in user.accounts.MetaMask"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <!-- Replace with account name when implemented, make editable -->
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                Metamask {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>

        <div v-if="!hideInfo">
          <div 
            v-if="user.accounts.CoinbaseWallet"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                src="/coinbase.svg"
                alt="Coinbase Icon"
              >
              <h6 class="flex items-center gap-15">
                Coinbase
                <span
                  class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
                >
                  {{ user.accounts.CoinbaseWallet.length }}
                </span>
              </h6>
            </div>
            <div
              v-for="(account, index) in user.accounts.CoinbaseWallet"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <!-- Replace with account name when implemented, make editable -->
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                Coinbase {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>
        <div v-if="!hideInfo">
          <div 
            v-if="user.accounts.IoPay"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                src="/iopay.svg"
                alt="IoPay Icon"
              >
              <h6 class="flex items-center gap-15">
                IoPay
                <span
                  class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
                >
                  {{ user.accounts.IoPay.length }}
                </span>
              </h6>
            </div>
            <div
              v-for="(account, index) in user.accounts.IoPay"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                IoPay {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>
        <div v-if="!hideInfo">
          <div 
            v-if="user.accounts.Ledger"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                src="/ledger.svg"
                alt="Ledger Icon"
              >
              <h6 class="flex items-center gap-15">
                Ledger
                <span
                  class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
                >
                  {{ user.accounts.Ledger.length }}
                </span>
              </h6>
            </div>
            <div
              v-for="(account, index) in user.accounts.Ledger"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <!-- Replace with account name when implemented, make editable -->
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                Ledger {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>

        <div v-if="!hideInfo">
          <div 
            v-if="user.accounts.Phantom"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                src="/phantom.svg"
                alt="Phantom Icon"
              >
              <h6 class="flex items-center gap-15">
                Phantom
                <span
                  class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
                >
                  {{ user.accounts.Phantom.length }}
                </span>
              </h6>
            </div>
            <div
              v-for="(account, index) in user.accounts.Phantom"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <!-- Replace with account name when implemented, make editable -->
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                Phantom {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>
        <div v-if="!hideInfo">
          <div 
            v-if="user.accounts.Trezor"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                src="/trezor.svg"
                alt="Trezor Icon"
              >
              <h6 class="flex items-center gap-15">
                Trezor
                <span
                  class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
                >
                  {{ user.accounts.Trezor.length }}
                </span>
              </h6>
            </div>
            <div
              v-for="(account, index) in user.accounts.Trezor"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <!-- Replace with account name when implemented, make editable -->
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                Trezor {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>
        <div v-if="!hideInfo">
          <div 
            v-if="user.accounts.WalletConnect"
            class="connected_wallets_card"
          >
            <div class="flex justify-between items-center mb-15">
              <img
                src="/walletconnect.svg"
                alt="WalletConnect Icon"
              >
              <h6 class="flex items-center gap-15">
                Wallet Connect
                <span
                  class="text-white bg-blue_3 px-12 py-5 rounded-[50%]
              flex justify-center items-center text-center"
                >
                  {{ user.accounts.WalletConnect.length }}
                </span>
              </h6>
            </div>
            <div
              v-for="(account, index) in user.accounts.WalletConnect"
              :key="account"
              class="flex gap-15 justify-between items-center mb-15"
            >
              <!-- Replace with account name when implemented, make editable -->
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                Wallet Connect {{ index + 1 }}
              </span>
              <span class="font-medium text-grey_6 s_md:sr-only not-sr-only">
                {{ index + 1 }}
              </span>
              <span class="flex gap-5 items-center text-grey_3 truncate">
                <span class="max-w-[400px] truncate">
                  {{ account }}
                </span>
                <button
                  class="text-primary text-[20px]
                hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(account)"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>