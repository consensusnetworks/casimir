<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import MultiwalletConnect from '@/components/navigation/components/MultiwalletConnect.vue'
import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'


const { user, removeAccount } = useUsers()
const { connectWallet, logout, loadingUserWallets } = useWallet()

const hideInfo = ref(false)

const hasWallets = ref(false)

const checkForWallets = () =>{
  if(!user.value) { hasWallets.value = false } else {hasWallets.value = true}
}

watch(user, () => {
  checkForWallets()
})
onMounted(async ()=>{
  checkForWallets()
})

const addWalletAddress = ref('')

const copyWalletAddress = (text: string) => {
  navigator.clipboard.writeText(text)
}

const showAddress = (address: string, hideText: boolean) => {
  if(!hideText) return address 
  return address.replace(/.(?=.{4,}$)/g, '*')
}
</script>
  
<template>
  <div class="">
    <div class="text-left">
      <h6 class="font-medium text-blue_3 mb-10">
        Sign in with your primary wallet.
      </h6>
      <h6 class="font-semibold text-body text-grey_5 mb-15">
        New user? Connecting any wallet will set the wallet as your primary wallet. 
      </h6>

      <h6 class="font-semibold text-body text-grey_3 max-w-[600px] mb-25">
        Other wallets connected will be secondary wallets under your primary wallet, 
        once primary wallet is connected, other wallets will be pulled down. 
        All wallets connected are only to view your assets. In order for you to use your
        wallet to stake with us, you must prove ownership via signing transactions. You can 
        add/remove wallets at your convience by visiting this page or hovering the 'Multi-Wallet' 
        on the top right section of our nav bar.

        You can visit the 
        <router-link
          :to="user?'/user-dashboard:' + user.address : '/connect-wallet' "
          class="btn_text inline font-bold text-body"
        >
          dashboard
        </router-link> 
          
        once you have connected all of the wallets that you want. 
      </h6>
    </div>
    <div
      class="multi_wallet_container gap-15"
      :class="hasWallets? '':'reverse_multi_wallet_container'"
    >
      <div>
        <!-- TD: make alerts for Metamask and others to remind them to have that account connected when connecting -->
        <!-- Only show when a user is connected -->
        <div
          v-if="hasWallets"
          class="border flex gap-15 mb-15 px-15 py-10"
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
          class="supported_wallet_box mb-15"
          @click="connectWallet('MetaMask')"
        >
          <img
            src="/metamask.svg"
            alt=""
          >
        
          <h6 class="sr-only s_sm:not-sr-only">
            Metamask
          </h6>

          <h6 class="s_sm:sr-only not-sr-only">
            M
          </h6>
        </button>
        <button
          class="supported_wallet_box  mb-15"
          @click="connectWallet('WalletConnect')"
        >
          <div class="flex items-center gap-15">
            <img
              src="/walletconnect.svg"
              alt=""
            > 
            <span 
              class="text-body font-bold text-grey_3 sr-only s_lg:not-sr-only"
            >
              Ethereum only
            </span>
          </div>
          <h6 class="sr-only s_sm:not-sr-only">
            Wallet Connect
          </h6>
          <h6 class="s_sm:sr-only not-sr-only">
            WC
          </h6>
        </button>
        <button
          class="supported_wallet_box mb-15"
          @click="connectWallet('CoinbaseWallet')"
        >
          <img
            src="/coinbase.svg"
            alt=""
          >
          <h6 class="sr-only s_sm:not-sr-only">
            Coinbase
          </h6>
          <h6 class="s_sm:sr-only not-sr-only">
            C
          </h6>
        </button>
        <!-- TD: Add modal to this for selecting which act they want to conenct with -->
        <button
          class="supported_wallet_box mb-15 opacity-50"
          disabled
          @click="connectWallet('Ledger')"
        >
          <img
            src="/ledger.svg"
            alt=""
          >
          <h6 class="sr-only s_sm:not-sr-only">
            Ledger
          </h6>
          <h6 class="s_sm:sr-only not-sr-only">
            L
          </h6>
        </button>
        <button
          class="supported_wallet_box mb-15"
          @click="connectWallet('IoPay')"
        >
          <img
            src="/IOTX.svg"
            alt=""
          >
          <h6 class="sr-only s_sm:not-sr-only">
            IoPay
          </h6>
          <h6 class="s_sm:sr-only not-sr-only">
            IP
          </h6>
        </button>
        <button
          class="supported_wallet_box mb-15"
          @click="connectWallet('Phantom')"
        >
          <img
            src="/phantom.svg"
            alt=""
          >
          <h6 class="sr-only s_sm:not-sr-only">
            Phantom
          </h6>
          <h6 class="s_sm:sr-only not-sr-only">
            PH
          </h6>
        </button>
        <!-- TD: Add keplr once implemented by @chris -->
        <button
          class="supported_wallet_box mb-15 opacity-50"
          disabled
        >
          <img
            src="/keplr.svg"
            alt=""
          >
          <h6 class="sr-only s_sm:not-sr-only">
            Keplr
          </h6>
          <h6 class="s_sm:sr-only not-sr-only">
            K
          </h6>
        </button>
        <button
          class="supported_wallet_box mb-15"
          @click="connectWallet('Trezor')"
        >
          <img
            src="/trezor.svg"
            alt=""
          >
          <h6 class="sr-only s_sm:not-sr-only">
            Trezor
          </h6>

          <h6 class="s_sm:sr-only not-sr-only">
            T
          </h6>
        </button>
      </div>
      <div
        v-if="hasWallets"
        class="w-full flex flex-col items-center gap-15 "
        :class="loadingUserWallets? 'loading_grey' : ''"
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
            @click="logout"
          >
            Disconnect Account
          </button>
        </div>
        <div
          v-for="(item, i) in user.accounts"
          :key="i"
          class="connected_wallets_card"
        >
          <div class="flex justify-between items-center mb-15">
            <div class="relative ">
              <img
                :src="'/'+ item.walletProvider.toLowerCase() + '.svg'"
                :alt="i + 'Icon'"
              >
              <i 
                v-show="user?.address === item.address"
                class="iconoir-star bg-red absolute text-[12px] top-[-0px] left-[-10px] text-primary"
              />
              <i 
                v-show="user?.address === item.address"
                class="iconoir-star bg-red absolute text-[12px] top-[-8px] left-[12px] text-primary"
              />
              <i 
                v-show="user?.address === item.address"
                class="iconoir-star bg-red absolute text-[12px] top-[-0px] right-[-10px] text-primary"
              />
            </div>
            
            <h6 class="flex items-center gap-15">
              {{ item.walletProvider }}
              <button 
                class="flex items-center text-decline hover:text-warning"
                @click="removeAccount(item.walletProvider, item.address, item.currency)"
              >
                <i 
                  class="iconoir-bin-minus "
                />
              </button>
            </h6>
          </div>
          <div>
            <div
              class="flex gap-15 justify-between items-center mb-15"
            >
              <span class="font-medium text-grey_6 sr-only s_md:not-sr-only">
                <span class=" whitespace-nowrap">{{ item.walletProvider.toLowerCase() + ' '+ i }}</span>
              </span>
              <span
                class="flex gap-5 justify-end items-center text-grey_3 w-full"
              >
                <span
                  class="max-w-[400px] truncate px-5" 
                >
                  {{ showAddress(item.address, hideInfo ) }}
                </span>
                <button
                  class="text-primary text-[20px]
                    hover:text-blue_3 cursor-pointer iconoir-copy"
                  @click="copyWalletAddress(item.address)"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="w-full border h-full flex flex-col items-center justify-center gap-15"
        :class="loadingUserWallets? 'loading_grey' : ''"
      >
        <h6 class="text-grey_2 font-medium text-center">
          No Wallets Connected
        </h6>
      </div>
    </div>
  </div>
</template>