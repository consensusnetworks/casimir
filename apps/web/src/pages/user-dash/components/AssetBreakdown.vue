<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import useUsers from '@/composables/users'

import useLandingStore from '../composables/landingStore'

const {
  userConnectedProviders,
  userConnectedCurrencies,
  selectedAsset
} = useLandingStore()
</script>
  
<template>
  <div
    class="flex flex-col min-w-[375px] w-full h-full gap-25 border-l-[0px] dash_s_sm:border-l 
    dash_s_sm:pl-20 border-t dash_s_sm:border-t-[0px] mt-50 dash_s_sm:mt-0
    pt-25 dash_s_sm:pt-0"
  >
    <div class="flex items-center">
      <span class="text-body text-grey_5 font-bold">
        Asset Breakdown
      </span>
    </div>
    <div class="w-full h-full flex flex-row gap-35">
      <div class="w-full flex flex-col gap-10">
        <div>
          <span class="text-caption font-bold text-grey_5">Wallets</span>
        </div>
        <div class="h-[200px] w-full flex flex-col gap-10 overflow-auto">
          <button
            v-for="(item, i) in userConnectedProviders"
            :key="i"
            class="px-5 py-3 flex items-center flex-wrap justify-between gap-10
           hover:bg-blue_1"
            :class="selectedAsset.provider === item.provider? 'bg-blue_1' : ''"
            @click="selectedAsset.provider != item.provider? selectedAsset = {provider: item.provider, currency: null} :selectedAsset = {provider: null, currency: null}"
          >
            <div class="flex items-center gap-5">
              <img
                :src="'/'+ item.provider.toLowerCase() + '.svg'"
                :alt="i + 'Icon'"
                class="h-15 w-15"
              >
              <span 
                class="text-caption font-medium text-grey_5"
              >{{ item.provider }}</span>
            </div>
                
            <span 
              class="text-caption font-medium text-grey_3"
            >
              ${{ item.balance }}
            </span>
          </button>
        </div>
      </div>
      <div class="w-full h-full flex flex-col gap-10 ">
        <div>
          <span class="text-caption font-bold text-grey_5">Currencies</span>
        </div>
        <div class="h-[200px] w-full flex flex-col gap-10 overflow-auto">
          <button 
            v-for="(item, i) in userConnectedCurrencies"
            :key="i"
            class="px-5 py-3 flex items-center flex-wrap justify-between gap-10
            hover:bg-blue_1"
            :class="selectedAsset.currency === item.currency? 'bg-blue_1' : ''"
            @click="selectedAsset.currency != item.currency? selectedAsset = {provider: null, currency: item.currency} :selectedAsset = {provider: null, currency: null}"
          >
            <div class="flex items-center gap-5">
              <img
                :src="'/'+ item.currency +'.svg'"
                alt="Bitcoin Logo"
                class="h-15 w-15"
              >
              <span 
                class="text-caption font-medium text-grey_5"
              >{{ item.name }}</span>
            </div>
                
            <span class="text-caption font-medium text-grey_3">
              ${{ item.balance }} | {{ item.ammount }} {{ item.currency }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
