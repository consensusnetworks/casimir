<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import VueFeather from 'vue-feather'

const selectedWallet = ref(null as null | string)
const formattedAmountToStake = ref(null as null | string )
const account_balance = ref(null as null | string)

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

const formattedWalletOptions = ref(
  [
    {
      provider: 'MetaMask',
      connectedAccounts: [
      '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
      '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
      '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
      ]
    }
  ]
)

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

watch(selectedWallet, () => {
  selectedWallet.value? account_balance.value = '$1,234.56' : account_balance.value = '- - -'
})

watch(formattedAmountToStake, () => {
  if(formattedAmountToStake.value){
    const floatAmount = parseFloat(formattedAmountToStake.value?.replace(/,/g, ''))
    // TD: Get max value here from selected wallet

    const maxAmount = 2000.25
    if(floatAmount > maxAmount){
      errorMessage.value = 'Insufficient Funds'
    } else {
      errorMessage.value = null
    }
  }
  
})

onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() =>{
  window.removeEventListener('click', handleOutsideClick)
})


</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full relative">
    <h6 class="account_balance mb-[12px]">
      Account Balance
    </h6>
    <h5 class="account_balance_amount mb-[27px]">
      {{ account_balance? account_balance : '- - -' }}
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
          v-for="item in formattedWalletOptions"
          id="selectWalletOptionsCard"
          :key="item.provider"
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
            v-for="wallet in item.connectedAccounts"
            :key="wallet"
            class="w-full text-left rounded-[8px] py-[10px] px-[14px] 
            hover:bg-grey_1 flex justify-between items-center text-grey_4 hover:text-grey_6"
            @click="selectedWallet = wallet, openSelectWalletInput = false"
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
        <h6 class="text-[#667085]">
          $
        </h6>
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
          USD
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
        0.0002 ETH
      </h6>
    </div>
    <div class="flex justify-between items-center my-[10px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Exchange Price
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        1 USD - 0.000ETH
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
      class="card_button h-[37px] w-full "
      :disabled="!(termsOfServiceCheckbox && selectedWallet && formattedAmountToStake && !errorMessage)"
    >
      Stake
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
        Terms of Service
      </div>
    </div>
  </div>
</template>

<style scoped>
.account_balance_amount{
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #344054;
}
.account_balance{
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
  background: #0F6AF2;
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