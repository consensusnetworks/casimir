<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import useUsers from '@/composables/users'
import usePrice from '@/composables/price'
import useSSV from '@/composables/ssv'
import router from '@/composables/router'

const {convertToWholeUnits } = usePrice()

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

// Helpers
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

// Toggles
const toggleSelectWalletModal = (on: boolean, e: any) => {
  if(openSelectWalletTab.value && on){
    if(e.target.id === ''){
      openSelectWalletTab.value = false
    }
  }
}
const toggleSignTransactionModal = (on: boolean, e: any) => {
  if(openSignTransactionTab.value && on){
    if(e.target.id === ''){
      openSignTransactionTab.value = false
    }
  }
}
const selectWallet = (wallet: any) => {
  selectedWallet.value = wallet
  openSelectWalletTab.value = false
}

// Watchers
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
watch(selectedWallet, () => {
  if(selectedWallet.value){
    // If we need a convert from Wei to Whole ETH
    // maxETHFromWallet.value = Number(convertToWholeUnits(selectedWallet.value.currency, Number(selectedWallet.value.balance)))
    maxETHFromWallet.value =  Math.round(selectedWallet.value.balance * 100) / 100 
  }
})
watch([stakeAmount, selectedWallet], () => {
  if(stakeAmount.value && maxETHFromWallet.value) {
    if(stakeAmount.value > maxETHFromWallet.value){
      stakingStatus.value.allowToStake = false
      stakingStatus.value.message = 'Insuffient Funds'
    } else {

      stakingStatus.value.allowToStake = true
      stakingStatus.value.message = `Stake ${Number(stakeAmount.value)} ${selectedWallet.value.currency}  from ${selectedWallet.value.walletProvider}`
    }
  } else {
    stakingStatus.value.allowToStake = false
    stakingStatus.value.message = 'Select wallet, then select amount to stake.'
  }
})
watch(isMaxETHSelected, () => {
  stakeAmount.value = maxETHFromWallet.value
})
watch(stakeAmount, () => {
  if(isNaN(stakeAmount.value)){
    stakeAmount.value = 0
  }
})

// Action Handlers
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
  <div class="col-span-3 h-full flex flex-col gap-20 relative">
    <div class="flex justify-between items-center w-full">
      <h6 class="font-bold text-[#727476]">
        Stake
      </h6>
    </div>

    <div
      class="h-full border border-border rounded-[5px] px-10 py-20"
    >
      <div class="h-full w-full">
        <div
          class="w-full h-full flex flex-col justify-between"
        >
          <div>
            <div class="font-bold text-body text-grey_5 mb-5">
              Select Wallet
            </div>
            <button 
              id="select_wallet_button"
              class="relative text-grey_7 bg-grey_2  rounded-[5px] text-body font-bold w-full
              hover:bg-grey_3 hover:text-grey_1 h-[200px]"
              @click="openSelectWalletTab = true"
            >
              <div 
                v-if="!selectedWallet"
                id="select_wallet_button_content"
              >
                No Wallet Selected
              </div>
              <div
                v-else 
                id="select_wallet_button_content"
                class="px-15 py-15 text-center"
              >
                <div
                  id="select_wallet_button_content"
                  class="flex justify-center"
                >
                  <img 
                    id="select_wallet_button_content"
                    :src="`/${selectedWallet.walletProvider.toLocaleUpperCase()}.svg`"
                    :alt="`${selectedWallet.walletProvider} Logo`"
                    class="w-40 h-40 rounded-[100%]"
                  >
                </div>
                <div 
                  id="select_wallet_button_content"
                  class="text-body font-light opacity-70"
                >
                  {{ selectedWallet.walletProvider }}
                </div>

                <div 
                  id="select_wallet_button_content"
                  class="my-20"
                >
                  <h5  
                    id="select_wallet_button_content"
                    class="font-bold"
                  >
                    {{ Math.round(selectedWallet.balance * 100) / 100 }} {{ selectedWallet.currency }}
                  </h5>
                </div>

                <div 
                  id="select_wallet_button_content"
                  class="opacity-70"
                >
                  <h6 
                    id="select_wallet_button_content"
                    class="text-body truncate"
                  >
                    {{ selectedWallet.address }}
                  </h6>
                </div>
              </div>
            </button>
          </div>
          
          <div class="flex justify-between items-center gap-10 h-75 py-10">
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
              class="min-w-1/3 relative border border-border rounded-[5px] flex gap-5 
          items-center justify-between h-full px-10 hover:border-primary"
              :class="isMaxETHSelected? 'border-primary' : 'opacity-[0.75]'"
              :disabled="maxETHFromWallet === null? true : false"
              @click="isMaxETHSelected = true"
            >
              <h5 class="font-bold text-border 1100s:text-[16px] 1100s:font-bold 1100s:mt-5 whitespace-nowrap">
                <span v-if="maxETHFromWallet">{{ maxETHFromWallet }} ETH</span>
                <span
                  v-else
                  class=" 550s:text-caption 550s:font-bold"
                > - - - </span>
              </h5> 
              <span class="font-bold text-grey_6 absolute top-[-9px] right-[10px] text-body bg-white px-5">
                max
              </span>
            </button>
          </div>
          
          <div class="h-75 flex justify-end items-end">
            <div
              id="stake_button_container" 
              class="text-right"
            >
              <button 
                id="stake_button"
                :disabled="!stakingStatus.allowToStake" 
                class="bg-primary py-6 px-12 text-white rounded-[5px] mb-10 mr-5
                 hover:bg-blue_7 disabled:opacity-[0.55]"
                @click="handleStakeAction"
              >
                <h6
                  id="stake_button_contenet" 
                  class="font-semibold"
                >
                  Stake
                </h6>
              </button>
              <!-- TD: Add tooltip for staking info -->
              <h5 class="iconoir-info-empty mb-1 align-middle text-grey_5 cursor-pointer" />
              <div 
                :class="stakingStatus.allowToStake? ' text-grey_7' : 'text-decline'"
                class="text-body font-medium"
              >
                {{ stakingStatus.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <transition
        id="select_wallet_section"
        name="slide_escape"
      >
        <div
          v-if="openSelectWalletTab"
          id="select_wallet_conatiner"
          class="page__boot shadow-lg h-[400px] absolute
          animate_up bg-[#edeff3] rounded-[5px] w-[250px] px-10"
          style="top: calc(50% - 185px); left: calc(50% - 125px)"
        >
          <div 
            id="select_wallet_item"
            class="w-full h-full flex flex-col gap-10 py-10"
          >
            <div
              id="select_wallet_item"
              class="flex justify-between items-center w-full"
            >
              <p
                id="select_wallet_title"
                class="text-body font-bold text-black"
              >
                Select a wallet to stake from
              </p>
              <button
                id="select_wallet_item"
                class="iconoir-cancel"
                @click="openSelectWalletTab = false"
              />
            </div>
            <div 
              id="select_wallet_item"
              class="bg-grey_2 h-2 w-full"
            />
            <div 
              v-if="user"
              id="select_wallet_item"
              class="h-full overflow-auto pr-5"
            >
              <button
                v-for="act in user.accounts"
                id="select_wallet_item"
                :key="act.address"
                class="w-full border border-border rounded-[5px] 
                mb-10 py-5 px-10 hover:bg-grey_3"
                @click="selectWallet(act)"
              >
                <div
                  id="select_wallet_item"
                  class="flex justify-between items-center gap-20"
                >
                  <img
                    id="select_wallet_item"
                    :src="`/${act.walletProvider.toLocaleUpperCase()}.svg`"
                    :alt="`${act.walletProvider} Logo`"
                    class="w-50 h-50 rounded-[100%]"
                  >
                  <div 
                    id="select_wallet_item"
                    class="text-right w-full truncate"
                  >
                    <div 
                      id="select_wallet_item"
                      class="mb-5"
                    >
                      <h6 id="select_wallet_item">
                        {{ act.balance? Math.round(Number(act.balance) * 100) / 100 : '---' }} {{ act.currency }}
                      </h6>
                    </div>
                    <div 
                      id="select_wallet_item"
                      class="truncate"
                    >
                      <span
                        id="select_wallet_item"
                        class="text-body truncate"
                      >
                        {{ act.address }}
                      </span>
                    </div>
                  </div>
                </div>
                <!-- <div 
                  id="select_wallet_item"
                  class="flex justify-between items-center mb-5 text-caption"
                >
                  <img
                    id="select_wallet_item"
                    :src="`/${act.walletProvider.toLocaleUpperCase()}.svg`"
                    :alt="`${act.walletProvider} Logo`"
                    class="w-15 h-15 rounded-[100%]"
                  >
                  <span 
                    id="select_wallet_item"
                  >
                    {{ act.balance? Math.round(Number(act.balance) * 100) / 100 : '---' }} {{ act.currency }}
                  </span>
                </div>
                <div  
                  id="select_wallet_item"
                  class="w-[100%] truncate text-caption"
                >
                  {{ act.address }}
                </div> -->
              </button>
            </div>
          </div>
        </div>
      </transition>

      <transition
        id="sign_transaction_section"
        name="slide_escape"
      >
        <div
          v-if="openSignTransactionTab"
          id="sign_transaction_section"
          class="page__boot shadow-lg h-[400px] absolute
          animate_up bg-[#edeff3] rounded-[5px] w-[250px] px-10"
          style="top: calc(50% - 185px); left: calc(50% - 125px)"
        >
          <div 
            id="sign_transaction_item"
            class="w-full h-full flex flex-col gap-20 py-10"
          >
            <div>
              <div
                id="sign_transaction_item"
                class="flex justify-between items-center w-full mb-10"
              >
                <p
                  id="sign_transaction_item"
                  class="text-body font-bold text-black"
                >
                  Sign transaction to stake
                </p>
                <button
                  id="sign_transaction_item"
                  class="iconoir-cancel"
                  @click="openSignTransactionTab = false"
                />
              </div>
              <div 
                id="sign_transaction_item"
                class="bg-grey_2 h-2 w-full"
              />
            </div>
            <!-- TD: ADD APY? -->
            <div 
              id="sign_transaction_amount"
              class="flex justify-between items-center pb-10"
            >
              <p 
                id="sign_transaction_amount_label"
                class="text-body font-bold text-grey_3"
              >
                Staking To
              </p>
              <p 
                id="sign_transaction_amount_stakingAmount"
                class="text-body font-bold text-grey_8"
              >
                SSV Validators
              </p>
            </div>
            <div 
              id="sign_transaction_amount"
              class="flex justify-between items-center pb-10"
            >
              <p 
                id="sign_transaction_amount_label"
                class="text-body font-bold text-grey_3"
              >
                Amount
              </p>
              <p 
                id="sign_transaction_amount_stakingAmount"
                class="text-body font-bold text-grey_8"
              >
                {{ stakeAmount }} ETH
              </p>
            </div>
            <div 
              id="sign_transaction_fees"
              class="flex justify-between gap-20 items-center pb-10"
            >
              <p 
                id="sign_transaction_fees_label"
                class="text-body font-bold text-grey_3"
              >
                Fees
              </p>
              <p 
                id="sign_transaction_fees_amount"
                class="text-body text-right font-bold text-grey_8"
              >
                {{ fees }}
              </p>
            </div>
            <div 
              id="sign_transaction_from"
              class="flex justify-between items-center pb-10"
            >
              <p 
                id="sign_transaction_from_label"
                class="text-body font-bold text-grey_3 w-1/3"
              >
                From
              </p>
              <div 
                id="sign_transaction_from_content"
                class="text-body font-bold text-grey_8 w-2/3 truncate flex gap-3"
              >
                <span 
                  id="sign_transaction_from_address"
                  class="truncate text-caption font-bold"
                >
                  {{ selectedWallet.address }} ...
                </span>
                <img
                  id="sign_transaction_from_wallet_providor"
                  :src="`/${selectedWallet.walletProvider.toLocaleUpperCase()}.svg`"
                  :alt="`${selectedWallet.walletProvider} Logo`"
                  class="w-15 h-15"
                >
              </div>
            </div>
            <div 
              id="sign_transaction_autorestake"
              class="flex justify-between items-center pb-10"
            >
              <p 
                id="sign_transaction_autorestake_title"
                class="text-body font-bold text-grey_3"
              >
                Auto Stake
              </p>
              <div 
                id="sign_transaction_autorestake_checkbox_container"
                class="text-caption font-bold text-grey_8"
              >
                <label
                  id="sign_transaction_autorestake_checkbox_switch" 
                  class="switch"
                >
                  <input
                    id="sign_transaction_autorestake_checkbox_switch_input" 
                    v-model="autoRestake"
                    type="checkbox"
                  >
                  <span
                    id="sign_transaction_autorestake_checkbox_switch_button" 
                    class="slider round"
                  />
                </label>
              </div>
            </div>
            <div 
              id="sign_transaction_sign"
              class="h-full flex items-end justify-end"
            >
              <div class="text-center w-full">
                <div class="flex w-full justify-between gap-5 items-center mb-10">
                  <button 
                    class="bg-primary py-6 px-12 text-white rounded-[5px] hover:bg-blue_7 disabled:opacity-[0.55]"
                    @click="handleConfirm"
                  >
                    <h6 class="font-bold text-body">
                      Sign Transaction
                    </h6>
                  </button>
                  <button 
                    class="bg-decline py-6 px-12 text-white rounded-[5px] hover:bg-red-600 disabled:opacity-[0.55]"
                    @click="handleCancel"
                  >
                    <h6 class="font-bold text-body">
                      Cancel
                    </h6>
                  </button>
                </div>
                <div 
                  id="sign_transaction_message"
                  class="text-body text-center font-medium text-grey_7 pr-2"
                >
                  Confirm and Sign Transaction
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
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