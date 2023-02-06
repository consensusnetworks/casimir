<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import useUsers from '@/composables/users'
import * as d3 from 'd3'

const { user } = useUsers()
const selectedAsset = ref(null as string | null)

// name, value
const tokens = ref([] as [{name: string, value: number}] )

const calculateTokens = () => {
 for (const item in user.value.accounts) {

  // console.log( item, user.value.accounts[item])
    const accounts = user.value.accounts[item]
    
    accounts.forEach((account: any) => {
      const index = tokens.value.findIndex(item => item.name === account.currency)
      if(index != -1){
        tokens.value[index].value += Number(account.balance)
      } else {
        tokens.value.push({
          name: account.currency,
          value: Number(account.balance)
        })
      }
    })
 }
}

onMounted(() => {
  calculateTokens()
})



const formatToMoney = (x: any) =>{
  return d3.format('$,s')(x.toPrecision(3))
}

const formatToPercentage = d3.format('.2f')

const formatSi = d3.format('.2s')
const collectTotalBalance = (assetType: string, item: any) => {
  if(assetType === 'wallet'){
    let totalBalance = 0
    item.forEach((item: any)  => {
      totalBalance += Number(item.balance_usd)
    })
    
    const s = formatSi(totalBalance)
    return s
  }
  if(assetType === 'token'){
    const s = formatSi(Number(tokens.value.find(i => i.name === item.name)?.value))
    return s
  }
}

const calculatePercentage =(assetType: string, name: string) => {
  if(assetType === 'wallet'){
    let totalTokenBalance = Number(tokens.value.find(item => item.name === selectedAsset.value)?.value )
    let selectedBalance = 0
    user.value.accounts[name].forEach(item => {
      if(item.currency === selectedAsset.value){
        selectedBalance += item.balance
      }
    })
    return formatToPercentage((selectedBalance/totalTokenBalance * 100)) + ' %'
  }
  if(assetType === 'token'){
    let totalWalletBalance = 0
    let inputTokenBalance = 0
    user.value.accounts[selectedAsset.value].forEach(account => {
      totalWalletBalance += Number(account.balance_usd)
      if(account.currency === name){
        inputTokenBalance += Number(account.balance_usd)
      }
    })

    return formatToPercentage((inputTokenBalance/totalWalletBalance * 100)) + ' %'
  }
}

const findAssettype = (name: string) =>{
  if(
    name === 'MetaMask' ||
    name === 'WalletConnect' ||
    name === 'CoinbaseWallet' ||
    name === 'Ledger' ||
    name === 'IoPay' ||
    name === 'Phantom' ||
    name === 'Keplr' ||
    name === 'Trezor'
  ){
    return 'wallet'
  } else if (
    name === 'BTC' ||
    name === 'ETH' ||
    name === 'IOTX' ||
    name === 'SOL'
  ) {
    return 'token'
  }
}

const returnAggergatedValue = (item: any, name: string) => {
  const assetType = findAssettype(name)
  const returnValue = '- - -'
  if(assetType === 'wallet'){
    if(selectedAsset.value === null || selectedAsset.value === name){
      return collectTotalBalance('wallet', item)
    }else if(findAssettype(selectedAsset.value) === 'token'){
      return calculatePercentage('wallet', name)
    }
  } else if(
    assetType === 'token'
  ){
    if(selectedAsset.value === null || selectedAsset.value === name){
      return collectTotalBalance('token', item) + ' ' + name
    }else if(findAssettype(selectedAsset.value) === 'wallet'){
      return calculatePercentage('token', name)
    }
  }
  return returnValue
}

</script>
  
<template>
  <div
    class="flex flex-col min-w-[375px] w-full h-full gap-25 border-l-[0px] dash_s_sm:border-l 
    dash_s_sm:pl-20 border-t dash_s_sm:border-t-[0px] mt-50 dash_s_sm:mt-0
    pt-25 dash_s_sm:pt-0"
  >
    <div class="flex items-center mt-5">
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
            v-for="(item, i) in user.accounts"
            :key="i"
            class="px-5 py-3 flex items-center flex-wrap justify-between gap-10
           hover:bg-blue_1"
            :class="selectedAsset === i? 'bg-blue_1' : ''"
            @click="selectedAsset === i? selectedAsset = null: selectedAsset = i"
          >
            <div class="flex items-center gap-5">
              <img
                :src="'/'+ i.toLowerCase() + '.svg'"
                :alt="i + 'Icon'"
                class="h-15 w-15"
              >
              <span 
                class="text-caption font-medium text-grey_5"
              >{{ i }}</span>
            </div>
                
            <span 
              class="text-caption font-medium text-grey_3"
            >
              {{ returnAggergatedValue(item, i) }}
            </span>
          </button>
        </div>
      </div>
      <div class="w-full h-full flex flex-col gap-10 ">
        <div>
          <span class="text-caption font-bold text-grey_5">Tokens</span>
        </div>
        <div class="h-[200px] w-full flex flex-col gap-10 overflow-auto">
          <button 
            v-for="(item, i) in tokens"
            :key="i"
            class="px-5 py-3 flex items-center flex-wrap justify-between gap-10
            hover:bg-blue_1"
            :class="selectedAsset === item.name? 'bg-blue_1' : ''"
            @click="selectedAsset === item.name? selectedAsset = null: selectedAsset = item.name"
          >
            <div class="flex items-center gap-5">
              <img
                :src="'/'+ item.name +'.svg'"
                alt="Bitcoin Logo"
                class="h-15 w-15"
              >
              <span 
                class="text-caption font-medium text-grey_5"
              >{{ item.name }}</span>
            </div>
                
            <span class="text-caption font-medium text-grey_3">
              {{ returnAggergatedValue(item, item.name) }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
