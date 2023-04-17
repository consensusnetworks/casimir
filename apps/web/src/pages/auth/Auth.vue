<script lang="ts" setup>
import { ref } from 'vue'
import useWallet from '@/composables/wallet'
import { ProviderString } from '@casimir/types'
import useUsers from '@/composables/users'

const { user } = useUsers()

const { connectWallet, activeWallets } = useWallet()

</script>

<template>
  <div class="h-full w-full flex justify-center items-center">
    <!-- TD: Add modal for Ledger -->
    <div class="min-w-[360px] w-full max-w-[600px]">
      <div class="mb-25">
        <img
          src="/casimir.svg"
          alt="Casimir Logo"
          class="w-30"
        >
      </div>
      <div 
        class="flex justify-between items-start gap-50 h-[400px]"
      >
        <div class="w-full border-y-[2px] border-l-[2px] rounded-l-[5px] h-full p-35 flex flex-col justify-between">
          <div>
            <h6 class="font-medium text-[#727476]">
              Connect Your Wallet
            </h6>
          </div>
          <div>
            <p class="text-caption font-medium text-grey_5 mb-10">
              New user? Connect any wallet to create an account.
              Once wallet is connected, you can connect more wallets in the dashboard page with the 
              Multi-Wallet tab in the top right of the page. Wallets connected will go under your 
              sign-in wallet. On sign in all connected wallets will be populating the dashboard.
            </p>
            <p class="text-caption font-medium text-grey_5">
              By connecting your wallets you agree to 
              <button class="font-semibold text-primary hover:text-blue_3"> 
                Casimir Terms 
              </button>
            </p>
          </div>
        </div>
        <div class="w-[350px] overflow-y-auto flex flex-col justify-center items-center">
          <button
            v-for="wallet in activeWallets"
            :key="wallet"
            class="flex justify-between items-center border-[1px] border-[#b2bacb] 
            rounded-[5px] mb-[10px] px-10 py-5 w-full hover:border-blue_3"
            @click="connectWallet(wallet)"
          >
            <img
              :src="'/'+wallet.toLocaleLowerCase()+'.svg'"
              :alt="wallet + ' Logo'"
              class="w-[35px] rounded-[100%]"
            >
            <h6 class="text-body font-bold text-[#8E9095]">
              {{ wallet }}
            </h6>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>