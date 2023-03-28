<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import useUsers from '@/composables/users'
import usePrice from '@/composables/price'
import useSSV from '@/composables/ssv'
import router from '@/composables/router'

const {convertToWholeUnits, } = usePrice()

const { getDepositFees, deposit } = useSSV()

const maxETHFromWallet = ref(null as null | number)
// will use this for later when givin options of typing in usd or eth
// const selectedTypeInput = ref('ETH' as 'ETH' | 'USD')
const isMaxETHSelected = ref(false)
const stakeAmount = ref()
const { user } = useUsers()
const fees = ref()
const autoRestake = ref(true)

const openSelectWalletTab = ref(false)
const openSignTransactionTab = ref(false)

const selectedWallet = ref(null as any)

const stakingStatus = ref({
  message: 'Select wallet, then select amount to stake.',
  allowToStake: false
})

const app = ref(null as any)

const toggleSelectWalletModal = (on: boolean, e: any) => {
  if(openSelectWalletTab.value && on){
    if(e.target.id === ''){
      openSelectWalletTab.value = false
    }
  }
}

const toggleSignTransactionModal = (on: boolean, e: any) => {
  if(openSelectWalletTab.value && on){
    if(e.target.id === ''){
      openSelectWalletTab.value = false
    }
  }
}

watch(openSelectWalletTab, () => {
  // console.log(openSelectWalletTab.value)
  if(openSelectWalletTab.value){
    app.value.addEventListener('click', (e) => {toggleSelectWalletModal(true, e)})
  } else {
    app.value.removeEventListener('click', (e) => {toggleSelectWalletModal(false, e)})
  }
})

watch(openSignTransactionTab, () => {
  // console.log(openSelectWalletTab.value)
  if(openSignTransactionTab.value){
    app.value.addEventListener('click', (e) => {toggleSignTransactionModal(true, e)})
  } else {
    app.value.removeEventListener('click', (e) => {toggleSignTransactionModal(false, e)})
  }
})

const selectWallet = (wallet: any) => {
  selectedWallet.value = wallet
  openSelectWalletTab.value = false
}

watch(selectedWallet, () => {
  if(selectedWallet.value){
    maxETHFromWallet.value = Number(convertToWholeUnits(selectedWallet.value.currency, Number(selectedWallet.value.balance)))
  }
})

watch([stakeAmount, selectedWallet], () => {
  if(stakeAmount.value && maxETHFromWallet.value) {
    if(stakeAmount.value > maxETHFromWallet.value){
      stakingStatus.value.allowToStake = false
      stakingStatus.value.message = 'Insuffient Funds'
    } else {

      stakingStatus.value.allowToStake = true
      stakingStatus.value.message = `Stake ${stakeAmount.value} ${selectedWallet.value.currency}  from ${selectedWallet.value.walletProvider}`
    }
  } else {
    stakingStatus.value.allowToStake = false
    stakingStatus.value.message = 'Select wallet, then select amount to stake.'
  }
})

watch(isMaxETHSelected, () => {
  stakeAmount.value = maxETHFromWallet.value
})

// checks if a valid number since we want it to be a text input
watch(stakeAmount, () => {
  if(isNaN(stakeAmount.value)){
    stakeAmount.value = 0
  }
})

async function getFees() {
  try {
    const fees = await getDepositFees()
    if (fees % 1 === 0) {
        return `${fees}.00%`
    }
    return `${fees}%`
  } catch (err){
    console.error(err)
    return 'Error connecting to SSV network. Please try again momentarily.'
  }
}
const handleConfirm = async () => {
  // loading.value = true
  // await deposit({ amount: stakeAmount.value.toString(), walletProvider: selectedWallet.value.walletProvider })
  // loading.value = false
  // router.push('/stake/eth')
}

const handleStakeAction = () => {
  openSignTransactionTab.value = true
}

const handleCancel = () => {
  stakeAmount.value = Number('')
  selectedWallet.value = null
  isMaxETHSelected.value = false
  maxETHFromWallet.value = null
  openSignTransactionTab.value = false
}

onMounted(async ()=>{
  app.value = document.getElementById('app')
  fees.value = await getFees()
})
</script>

<template>
  <div class="col-span-3 h-full flex flex-col gap-20">
    <div class="flex justify-between items-center w-full">
      <h6 class="font-bold text-[#727476]">
        Stake
      </h6>
    </div>
    <div
      class="w-full border border-border rounded-[5px] h-full px-20 py-10
    flex flex-col justify-between gap-20"
    >
      <div class="flex justify-between items-center w-full pt-10 mb-20">
        <span class="text-caption font-bold text-black">
          Stake ETH to SSV Validators
        </span>
      </div>
      <div class="flex justify-between items-center gap-10 h-75">
        <div 
          :class="isMaxETHSelected? 'opacity-[0.25]' : ''"
          class="flex items-center gap-20 h-full px-10 w-2/3"
          @click="isMaxETHSelected = false"
        >
          <div class="relative">
            <!-- 
              Add this once we get a way to convert usd -> eth
              :class="selectedTypeInput === 'ETH'? 'selected_input_type' : 'not_selected_input_type'"
              @click="selectedTypeInput = 'ETH'"
             -->
            <button
              class="on_hover selected_input_type"
            >
              <img
                src="/eth.svg"
                alt="ETH Logo"
              >
            </button>
            <!-- <button
              class="iconoir-dollar on_hover"
              :class="selectedTypeInput === 'USD'? 'selected_input_type' : 'not_selected_input_type'"
              @click="selectedTypeInput = 'USD'"
            /> -->
          </div>
          <div>
            <input
              v-model="stakeAmount"
              placeholder="0.00"
              type="text"
              class="text-[24px] w-full text-border font-medium outline-none"
            >
          </div>
        </div>
        <button 
          class="w-1/3 relative border border-border rounded-[5px] flex 
          items-center justify-between h-full px-10 hover:border-primary"
          :class="isMaxETHSelected? 'border-primary' : 'opacity-[0.75]'"
          :disabled="maxETHFromWallet === null? true : false"
          @click="isMaxETHSelected = true"
        >
          <h5 class="font-bold text-border">
            <span v-if="maxETHFromWallet">{{ maxETHFromWallet }}</span>
            <span v-else> - - - </span>
          </h5> 
          <span class="text-body font-light pt-10 text-border">ETH</span>
          <span class="font-bold text-grey_6 absolute top-[-9px] right-[10px] text-body bg-white px-5">
            max
          </span>
        </button>
      </div>
      <div 
        class="h-75 relative text-grey_5 bg-[#edeff3] flex justify-between items-center px-10 rounded-[5px]"
      >
        <span class="text-body font-bold">
          From
        </span>
        <button 
          v-if="selectedWallet === null"
          id="select_wallet_button"
          class="text-body font-bold flex gap-10 items-center bg-primary text-white px-12 py-5 rounded-[5px]"
          @click="openSelectWalletTab = true"
        >
          Select Wallet
        </button>
        <button
          v-else
          id="selected_wallet_button_container"
          class="w-[170px] border border-border rounded-[5px] px-20 py-5 hover:border-primary"
          @click="openSelectWalletTab = true"
        >
          <div 
            id="selected_wallet_button_content_one"
            class="flex items-center justify-end gap-5 w-full"
          >
            <img
              :src="`/${selectedWallet.walletProvider.toLocaleUpperCase()}.svg`"
              :alt="`${selectedWallet.walletProvider} Logo`"
              class="w-15 h-15"
            >
            <span class="text-clip truncate text-body">
              {{ selectedWallet.address }}
            </span>
          </div>
          <div 
            id="selected_wallet_button_content_two"
            class="w-full flex justify-end truncate text-caption font-bold mt-10"
          >
            <span>
              {{ convertToWholeUnits(selectedWallet.currency, Number(selectedWallet.balance)) }} {{ selectedWallet.currency }}
            </span>
          </div>
        </button>
        <div 
          v-if="openSelectWalletTab"
          id="select_wallet_modal"
          class="absolute bg-white border border-border rounded-[5px] px-10 py-15 h-[420px] 
          w-[340px] shadow-xl overflow-auto z-[10] flex flex-col"
          style="top: calc(50% - 255px); left: calc(50% - 170px);"
        >
          <button
            v-for="act in user.accounts"
            :key="act.address"
            class="w-full border border-border rounded-[5px] mb-10 py-5 px-10 hover:border-primary"
            @click="selectWallet(act)"
          >
            <div class="flex justify-between items-center mb-5">
              <img
                :src="`/${act.walletProvider.toLocaleUpperCase()}.svg`"
                :alt="`${act.walletProvider} Logo`"
                class="w-25 h-25"
              >
              <span>
                {{ convertToWholeUnits(act.currency, Number(act.balance)) }} {{ act.currency }}
              </span>
            </div>
            <div class="w-[100%] truncate text-body">
              {{ act.address }}
            </div>
          </button>
        </div>
        <div 
          v-if="openSignTransactionTab"
          id="sign_transaction_modal"
          class="absolute bg-white border border-border rounded-[5px] px-10 py-15 h-[420px] 
          w-[340px] shadow-xl overflow-auto z-[10] flex flex-col"
          style="top: calc(50% - 255px); left: calc(50% - 170px);"
        >
          <p class="text-caption font-bold text-black mb-40">
            Stake ETH to SSV Validators
          </p>
          <div class="flex justify-between items-center mb-20">
            <p class="text-body font-bold text-grey_3">
              Amount
            </p>
            <p class="text-body font-bold text-grey_8">
              {{ stakeAmount }} ETH
            </p>
          </div>
          <div class="flex justify-between items-center mb-20">
            <p class="text-body font-bold text-grey_3">
              Fees
            </p>
            <p class="text-body font-bold text-grey_8">
              {{ fees }}
            </p>
          </div>
          <div class="flex justify-between items-center mb-20">
            <p class="text-body font-bold text-grey_3 w-1/3">
              From
            </p>
            <div class="text-body font-bold text-grey_8 w-2/3 truncate flex gap-3">
              <span class="truncate text-body font-bold">
                {{ selectedWallet.address }} ...
              </span>
              <img
                :src="`/${selectedWallet.walletProvider.toLocaleUpperCase()}.svg`"
                :alt="`${selectedWallet.walletProvider} Logo`"
                class="w-15 h-15"
              >
            </div>
          </div>

          <div class="flex justify-between items-center mb-20">
            <p class="text-body font-bold text-grey_3">
              Auto Stake {{ autoRestake }}
            </p>
            <div class="text-body font-bold text-grey_8">
              <label class="switch">
                <input
                  v-model="autoRestake"
                  type="checkbox"
                >
                <span class="slider round" />
              </label>
            </div>
          </div>
          <div class="h-full flex items-end justify-end">
            <div class="text-center w-full">
              <div class="flex flex-col w-full justify-center gap-5 items-center mb-10">
                <button 
                  class="bg-primary py-6 px-12 text-white rounded-[5px] hover:bg-blue_7 disabled:opacity-[0.55]"
                  @click="handleConfirm"
                >
                  <h6 class="font-bold text-body">
                    Sign Transaction
                  </h6>
                </button>
                <button 
                  class="bg-decline py-6 px-12 text-white rounded-[5px] hover:bg-blue_7 disabled:opacity-[0.55]"
                  @click="handleCancel"
                >
                  <h6 class="font-bold text-body">
                    Cancel
                  </h6>
                </button>
              </div>
              <div 
                class="text-caption font-medium text-grey_7 pr-2"
              >
                Confirm and Sign Transaction
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="h-75 flex justify-end items-end">
        <div class="text-right">
          <button 
            :disabled="!stakingStatus.allowToStake"
            class="bg-primary py-6 px-12 text-white rounded-[5px] mb-10 hover:bg-blue_7 disabled:opacity-[0.55]"
            @click="handleStakeAction"
          >
            <h6 class="font-semibold">
              Stake
            </h6>
          </button>
          <div 
            :class="stakingStatus.allowToStake? ' text-grey_7' : 'text-decline'"
            class="text-caption font-medium"
          >
            {{ stakingStatus.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected_input_type{
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background-color: #8C8C8C;
  color: white;
  font-size: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.not_selected_input_type{
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  top: -12px;
  right: -12px;
  background-color: #8C8C8C;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.on_hover:hover{
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
}

</style>