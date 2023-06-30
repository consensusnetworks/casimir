<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { FormattedWalletOption, ProviderString } from '@casimir/types'
import VueFeather from 'vue-feather'
import usePrice from '@/composables/price'
import useEthers from '@/composables/ethers'
import useUsers from '@/composables/users'
import useContracts from '@/composables/contracts'

import TermsOfService from '@/components/TermsOfService.vue'

const { deposit, getDepositFees, withdraw } = useContracts()
const { getEthersBalance } = useEthers()
const { getCurrentPrice } = usePrice()
const { user } = useUsers()

const selectedProvider = ref<ProviderString>('')
const selectedWallet = ref(null as null | string)
const formattedAmountToStake = ref<string>('')
const address_balance = ref(null as null | string)
const currentEthPrice = ref<number>(0)
const estimatedFees = ref<number|string>('-')

const openSelectWalletInput = ref(false)

const openTermsOfService = ref(false)

const errorMessage = ref(null as null | string)

const termsOfServiceCheckbox = ref(false)

const handleInputOnAmountToStake = (event: any) => {
  const value = event.target.value.replace(/[^\d.]/g, '')
  const parts = value.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Limit to two decimal places
  if (parts[1] && parts[1].length > 2) {
    parts[1] = parts[1].slice(0, 2)
  }

  // Update the model value
  formattedAmountToStake.value = parts.join('.')
}

const formattedWalletOptions = ref<Array<FormattedWalletOption>>([])

const convertString = (inputString: string) => {
  if (inputString.length <= 4) {
    return inputString
  }

  var start = inputString.substring(0, 4)
  var end = inputString.substring(inputString.length - 4)
  var middle = '*'.repeat(4)

  return start + middle + end
}

const handleOutsideClick = (event: any) => {
  const selectWalletInputContainer = document.getElementById('selectWalletInputContainer')
  const selectWalletOptionsCard = document.getElementById('selectWalletOptionsCard')
  const selectWalletInputButton = document.getElementById('selectWalletInputButton')
  if(selectWalletInputContainer && selectWalletOptionsCard && selectWalletInputButton){
    if(openSelectWalletInput.value) {
      if(!selectWalletInputContainer.contains(event.target)){
        if(!selectWalletInputButton.contains(event.target)){
          openSelectWalletInput.value = false
        }
      }
    }
  }

  const termsOfServiceContainer = document.getElementById('termsOfServiceContainer')
  const termsOfServiceCard = document.getElementById('termsOfServiceCard')
  const termsOfServiceButton = document.getElementById('termsOfServiceButton')

  
  if(termsOfServiceCard && termsOfServiceButton && termsOfServiceContainer){
    if(openTermsOfService.value) {
      if(!termsOfServiceCard.contains(event.target)){
        if(!termsOfServiceButton.contains(event.target)){
          openTermsOfService.value = false
        }
      }
    }
  }
}

const aggregateAddressesByProvider = () => {
  formattedWalletOptions.value = []
  // Iterate over user.value.accounts and aggregate addresses by provider
  if(user.value){
    const accounts = user.value.accounts
    const providers = accounts.map((account) => account.walletProvider)
    const uniqueProviders = [...new Set(providers)]
    uniqueProviders.forEach((provider) => {
      const addresses = accounts.filter((account) => account.walletProvider === provider).map((account) => account.address)
      formattedWalletOptions.value.push({
        provider,
        addresses
      })
    })
  } else {
    // empty out staking comp
    selectedProvider.value = ''
    selectedWallet.value = null
    formattedAmountToStake.value = ''
    address_balance.value = null
  }
}

watch(selectedWallet, async () => {
  address_balance.value = selectedWallet.value ?  (Math.round( await getEthersBalance(selectedWallet.value) * 100) / 100 ) + ' ETH': '- - -'
})

watch(formattedAmountToStake, async () => {
  if(formattedAmountToStake.value){
    const floatAmount = parseFloat(formattedAmountToStake.value?.replace(/,/g, ''))
    let maxAmount
    // minAmount is 0.0001 ETH 
    let minAmount = 0.0001
    if(selectedWallet.value){
      maxAmount = await getEthersBalance(selectedWallet.value)
    }else{
      maxAmount = 0
    }
    
    if(floatAmount > maxAmount){
      errorMessage.value = 'Insufficient Funds'
    } else if(floatAmount < minAmount){
      errorMessage.value = 'Minimun Staking is 0.0001 ETH'
    }else {
      errorMessage.value = null
    }
  } else{
    errorMessage.value = null
  }
})

watch(user, () => {
  aggregateAddressesByProvider()
})

onMounted(async () => {
  window.addEventListener('click', handleOutsideClick)
  aggregateAddressesByProvider()
  currentEthPrice.value = Math.round((await getCurrentPrice({coin: 'ETH', currency: 'USD'})) * 100) / 100
  estimatedFees.value = await getDepositFees()
})


onUnmounted(() =>{
  window.removeEventListener('click', handleOutsideClick)
})

const loading = ref(false)
const success = ref(false)
const failure = ref(false)
const stakeButtonText = ref('Stake')

const handleDeposit = async () => {
  loading.value = true
  const isSuccess = await deposit({ amount: formattedAmountToStake.value, walletProvider: selectedProvider.value })
  loading.value = false
  if (isSuccess) {
    success.value = true
    stakeButtonText.value = 'Transaction Submitted'
  } else {
    failure.value = true
    stakeButtonText.value = 'Transaction Failed'
  }

  setTimeout(() => {
    success.value = false
    failure.value = false
    stakeButtonText.value = 'Stake'

    // empty out staking comp
    selectedProvider.value = ''
    selectedWallet.value = null
    formattedAmountToStake.value = ''
    address_balance.value = null
    
  }, 3000)
  

  
}
</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full relative">
    <h6 class="address_balance mb-[12px]">
      Account Balance
    </h6>
    <h5 class="address_balance_amount mb-[27px]">
      {{ address_balance? address_balance : '- - -' }}
    </h5>

    <h6 class="card_title mb-[11px]">
      Wallet
    </h6>
    <div class="card_input text-black mb-[22px] relative">
      <button
        id="selectWalletInputButton"
        class="flex items-center justify-between gap-[8px] w-full h-full px-[10px] py-[14px]"
        :class="selectedWallet? 'text-black' : 'text-grey_4'"
        @click="openSelectWalletInput = !openSelectWalletInput"
      >
        <h6>
          {{ selectedWallet? convertString(selectedWallet) : 'Select wallet' }}
        </h6>
        <vue-feather
          :type="openSelectWalletInput? 'chevron-up' : 'chevron-down'" 
          size="36"
          class="icon w-[20px]"
        />
      </button>
      <div
        v-show="openSelectWalletInput"
        id="selectWalletInputContainer"
        class="absolute top-[110%] w-full bg-white rounded-[8px] border border-[#D0D5DD] px-[10px] py-[14px] max-h-[250px] overflow-auto"
      >
        <div
          v-if="formattedWalletOptions.length === 0"
          class="flex justify-center items-center text-grey_4 py-[10px]"
        >
          No wallets connected
        </div>
        <div
          v-for="item in formattedWalletOptions"
          id="selectWalletOptionsCard"
          :key="item.provider"
          class="mt-[5px] mb-[10px]"
        >
          <div class="w-full text-[12px] text-grey_6 flex items-center gap-[8px] mb-[10px]">
            <img
              :src="`${item.provider.toLocaleLowerCase()}.svg`"
              :alt="`${item.provider.toLocaleLowerCase()} Icon`"
              class="w-[16px] h-[16px]"
            >
            {{ item.provider }}
          </div>
          

          <button
            v-for="wallet in item.addresses"
            :key="wallet"
            class="w-full text-left rounded-[8px] py-[10px] px-[14px] 
            hover:bg-grey_1 flex justify-between items-center text-grey_4 hover:text-grey_6"
            @click="selectedWallet = wallet, openSelectWalletInput = false, selectedProvider = item.provider"
          >
            {{ convertString(wallet) }}
            <vue-feather
              type="chevron-right" 
              size="36"
              class="icon w-[20px]"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center gap-[8px] mb-[11px] mt-[22px]">
      <h6 class="card_title">
        Amount
      </h6>

      <span class="text-[12px] font-[600] leading-[20px] text-h text-red-500">
        {{ errorMessage }}
      </span>
    </div>
    

    <div class="card_input text-black px-[10px] py-[14px]">
      <div class="flex items-center gap-[8px]">
        <!-- <h6 class="text-[#667085]">
          $
        </h6> -->
        <input
          id="amount"
          v-model="formattedAmountToStake"
          type="text"
          pattern="^\d{1,3}(,\d{3})*(\.\d+)?$"
          placeholder="0.00"
          class=" outline-none"
          @input="handleInputOnAmountToStake"
        >
      </div>
      <div class="flex items-center gap-[4px]">
        <h6 style="font-weight: 400;">
          ETH
        </h6>
      </div>
    </div>

    <p class="card_message">
      The amount to stake in set currency
    </p>

    <div class="flex justify-between items-center mt-[32px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Fees
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        {{ estimatedFees }}.00%
      </h6>
    </div>
    <div class="flex justify-between items-center my-[10px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Exchange Rate
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        ${{ currentEthPrice }}/ETH
      </h6>
    </div>
    <div class="flex justify-between items-center mb-[39px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Estimated APY
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        $0.04
      </h6>
    </div>

    <div class="flex items-center gap-[18px] mb-[27px]">
      <input
        v-model="termsOfServiceCheckbox"
        type="checkbox"
        class="card_checkbox"
      > 
      <button
        id="termsOfServiceButton"
        class="card_checkbox_text"
        @click="openTermsOfService = !openTermsOfService"
      >
        I agree to the terms of service
      </button>
    </div>

    <button
      class="card_button  h-[37px] w-full "
      :class="success? 'bg-approve' : failure? 'bg-decline' : 'bg-primary'"
      :disabled="!(termsOfServiceCheckbox && selectedWallet && formattedAmountToStake && !errorMessage)"
      @click="handleDeposit()"
    >
      <div
        v-if="loading"
        class="dots_container flex justify-center items-center gap-[5px]"
      >
        <div class="dot" />
        <div class="dot" />
        <div class="dot" />
      </div>
      <div
        v-else
        class="flex items-center justify-center gap-[5px]"
      >
        {{ stakeButtonText }}
        <vue-feather
          v-if="success"
          type="check"
          size="36"
          class="icon w-[20px]"
        />
        <vue-feather
          v-if="failure"
          type="x"
          size="36"
          class="icon w-[20px]"
        />
      </div>
    </button>
    <div
      v-show="openTermsOfService"
      id="termsOfServiceContainer"
      class="bg-black/[0.28] w-full h-full absolute top-0 left-0 flex items-center justify-center rounded-[3px] "
    >
      <div
        id="termsOfServiceCard"
        class="bg-white rounded-[8px] px-[14px] py-[10px] max-h-[400px] w-[80%] overflow-auto shadow-sm card_title"
      >
        <TermsOfService />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-bottom: 5px;
  background-color: #fff;
}
.dots_container .dot:nth-last-child(1) {
  animation: jumpingAnimation 1s 0.1s ease-in infinite;
}
.dots_container .dot:nth-last-child(2) {
  animation: jumpingAnimation 1s 0.2s ease-in infinite;
}
.dots_container .dot:nth-last-child(3) {
  animation: jumpingAnimation 1s 0.3s ease-in infinite;
}

@keyframes jumpingAnimation {
  0% {
    transform: translate3d(0, 0,0);
  }
  50% {
    transform: translate3d(0, 6px,0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}
.address_balance_amount{
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #344054;
}
.address_balance{
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
}
.card_container{
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}

.card_title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #344054;
}

.card_input{
    height: 44px;
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
    letter-spacing: -0.01em;
    color: #101828;
    margin-bottom: 6px;
}

.card_message {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: #667085;
}

.card_button {
  /* background: #0F6AF2; */
  border-radius: 5px;
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.03em;
  color: #FFFFFF;
}:disabled{
  background: rgba(15, 106, 242, 0.31);
}

.card_analytics_label {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #98A2B3;
}

.card_analytics_amount {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    text-align: right;
    color: #344054;
}

.card_checkbox_text{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 11px;
    line-height: 14px;
    letter-spacing: -0.01em;
    text-decoration-line: underline;
    color: #344054;
}

.card_checkbox{
    background: #FFFFFF;
    border: 1px solid #7F7889;
    box-shadow: 0px 0px 0px 4px rgba(237, 235, 255, 0.26);
    border-radius: 4px;
}
</style>