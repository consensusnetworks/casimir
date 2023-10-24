<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { FormattedWalletOption, ProviderString } from '@casimir/types'
import VueFeather from 'vue-feather'
import useStaking from '@/composables/staking'
import useEthers from '@/composables/ethers'
import useFormat from '@/composables/format'
import usePrice from '@/composables/price'
import useUser from '@/composables/user'
import confetti from 'canvas-confetti'

import TermsOfService from '@/components/TermsOfService.vue'

const { stakingComposableInitialized, deposit, getDepositFees, getUserStake, initializeStakingComposable } = useStaking()
const { getEthersBalance } = useEthers()
const { convertString } = useFormat()
const { getCurrentPrice } = usePrice()
const { user, updateUserAgreement } = useUser()

// Staking Component Refs
const addressBalance = ref<string | null>(null)
const currentEthPrice = ref(0)
const stakeType = ref<'default' | 'eigen'>('default')
const currentUserStake = ref(0)
const estimatedFees = ref<number | string>('-')
const estimatedAPY = ref<string>('4.00')
const formattedAmountToStake = ref('')
const formattedWalletOptions = ref<Array<FormattedWalletOption>>([])
const selectedStakingProvider = ref<ProviderString>('')
const selectedWalletAddress = ref(null as null | string)

// Wallet Select Refs
const errorMessage = ref(null as null | string)
const openSelectWalletInput = ref(false)
const openTermsOfService = ref(false)
const termsOfServiceCheckbox = ref(false)

// Staking Action Loader Refs
const loading = ref(false)
const stakeButtonText = ref('Stake')
const stakingActionLoader = ref(false)
const success = ref(false)
const failure = ref(false)

const eigenDisabled = ref(true) // Keeps eigen disabled until Casimir is ready to support it.
const isShining = ref(true) // Determines if the shine effect is active
const isToggled = ref(false) // Determines the toggle state
const toggleBackgroundColor = ref('#eee')  // Initial color

const toggleShineEffect = () => {
  isToggled.value = !isToggled.value
  isShining.value = isToggled.value
  // toggleEstimatedAPY()

  // Change the color based on the toggle state
  toggleBackgroundColor.value = isToggled.value ? 'green' : '#eee'

  // Update stakeType
  stakeType.value = isToggled.value ? 'eigen' : 'default'
  if (stakeType.value === 'eigen') {
    triggerConfetti()
  }
}

const confettiButton = ref<HTMLElement | null>(null)
const triggerConfetti = () => {
  if (confettiButton.value) {
    const rect = confettiButton.value.getBoundingClientRect()
    const x = (rect.left + rect.right) / 2 / window.innerWidth
    const y = (rect.top + rect.bottom) / 2 / window.innerHeight
    
    confetti({
      particleCount: 250,
      spread: 100,
      origin: { x: x, y: y }
    })
  }
}

function toggleEstimatedAPY() {
  if (estimatedAPY.value === '5.50') {
    estimatedAPY.value = '10.00'
  } else {
    estimatedAPY.value = '5.50'
  }
}

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

const selectAmountInput = () => {
  const inputElement = document.getElementById('amount_input') as HTMLInputElement
  
  if(inputElement){

    inputElement.setSelectionRange(0, inputElement.value.length)
  
    // For mobile devices
    inputElement.select()
  }
  
}

const aggregateAddressesByProvider = () => {
  formattedWalletOptions.value = []
  // Iterate over user.value.accounts and aggregate addresses by provider
  if (user.value) {
    const accounts = user.value.accounts
    const providers = accounts.map((account) => account.walletProvider)
    const uniqueProviders = [...new Set(providers)] as Array<ProviderString>
    uniqueProviders.forEach((provider) => {
      const addresses = accounts.filter((account) => account.walletProvider === provider).map((account) => account.address)
      formattedWalletOptions.value.push({
        provider,
        addresses
      })
    })
  } else {
    // empty out staking comp
    selectedStakingProvider.value = ''
    selectedWalletAddress.value = null
    formattedAmountToStake.value = ''
    addressBalance.value = null
    currentUserStake.value = 0
  }
}

watch(formattedAmountToStake, async () => {
  if (formattedAmountToStake.value) {
    const floatAmount = parseFloat(formattedAmountToStake.value?.replace(/,/g, ''))
    let maxAmount
    // minAmount is 0.0001 ETH
    let minAmount = 0.0001
    if (selectedWalletAddress.value) {
      maxAmount = await getEthersBalance(selectedWalletAddress.value)
    } else {
      maxAmount = 0
    }

    if (floatAmount > maxAmount) {
      errorMessage.value = 'Insufficient Funds'
    } else if (floatAmount < minAmount) {
      errorMessage.value = 'Minimun Staking is 0.0001 ETH'
    } else {
      errorMessage.value = null
    }
  } else {
    errorMessage.value = null
  }
})

watch(selectedWalletAddress, async () => {
  if (!stakingComposableInitialized.value) return
  if (selectedWalletAddress.value) {
    addressBalance.value = (Math.round(await getEthersBalance(selectedWalletAddress.value) * 100) / 100) + ' ETH'
    isShining.value = true
    // currentUserStake.value = await getUserStake(selectedWalletAddress.value)
  } else {
    addressBalance.value = null
    // currentUserStake.value = 0
  }
})

watch(user, async () => {
  if (!stakingComposableInitialized.value) return
  if (user.value?.id) {
    aggregateAddressesByProvider()
    termsOfServiceCheckbox.value = user.value?.agreedToTermsOfService as boolean
    addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + ' ETH'
    selectedWalletAddress.value = user.value?.address as string
    selectedStakingProvider.value = user.value?.walletProvider as ProviderString
    // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
    // estimatedFees.value = await getDepositFees()
  } else {
    selectedStakingProvider.value = ''
    selectedWalletAddress.value = null
    formattedAmountToStake.value = ''
    addressBalance.value = null
    // currentUserStake.value = 0
  }
})

onMounted(async () => {
  // TODO: @ccali11 - Want to make sure this is non-blocking
  await initializeStakingComposable()
  aggregateAddressesByProvider()
  currentEthPrice.value = Math.round((await getCurrentPrice({ coin: 'ETH', currency: 'USD' })) * 100) / 100
  if (user.value?.id) {
    // estimatedFees.value = await getDepositFees()
    addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + ' ETH'
    selectedStakingProvider.value = user.value?.walletProvider as ProviderString
    selectedWalletAddress.value = user.value?.address as string
    if (!stakingComposableInitialized.value) return
    // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
    isShining.value = true
  }
})

const handleOutsideClickForWalletInput = (event: any) => {
  const selectWalletInputContainer = document.getElementById('selectWalletInputContainer')
  const selectWalletInputButton = document.getElementById('selectWalletInputButton')

  if(!selectWalletInputContainer?.contains(event.target) && !selectWalletInputButton?.contains(event.target)){
    openSelectWalletInput.value = false
  }
}

const handleOutsideClickForTermsOfService = (event: any) => {
  const termsOfServiceContainer = document.getElementById('termsOfServiceContainer')
  const termsOfServiceButton = document.getElementById('termsOfServiceButton')


  if(!termsOfServiceContainer?.contains(event.target) && !termsOfServiceButton?.contains(event.target)){
    openTermsOfService.value = false
  }
}

watch(openSelectWalletInput, ()=>{
  if(openSelectWalletInput.value){
    window.addEventListener('click', handleOutsideClickForWalletInput)
  }else {
    window.removeEventListener('click', handleOutsideClickForWalletInput)
  }
})

watch(openTermsOfService, ()=>{
  if(openTermsOfService.value){
    window.addEventListener('click', handleOutsideClickForTermsOfService)
  }else {
    window.removeEventListener('click', handleOutsideClickForTermsOfService)
  }
})

const handleDeposit = async () => {
  stakeButtonText.value = 'Staking...'

  // const activeAddress = await detectActiveWalletAddress(selectedStakingProvider.value)
  // if (activeAddress !== selectedWalletAddress.value) {
  //   formattedAmountToStake.value = ''
  //   return alert(`The account you selected is not the same as the one that is active in your ${selectedStakingProvider.value} wallet. Please open your browser extension and select the account that you want to log in with.`)
  // }

  const result = await deposit({ 
    amount: formattedAmountToStake.value,
    walletProvider: selectedStakingProvider.value,
    type: stakeType.value 
  })

  if (!result) stakeButtonText.value = 'Failed!'
  stakeButtonText.value = 'Staked!'

  setTimeout(() =>{
    stakeButtonText.value = 'Stake'
    formattedAmountToStake.value = ''
  }, 1000)

  if (result) {
    const waitResponse = await result.wait(1)
    isToggled.value = false
    addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + ' ETH'
    if (waitResponse){
      alert('Your Stake Has Been Deposited!')
    } else {
      alert('Your Stake Action Has Failed, Please Try Again Later!')
    }
    console.log('waitResponse :>> ', waitResponse)
  }

  // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
}
</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full relative">
    <div
      v-if="stakingActionLoader"
      class="absolute w-full h-full bg-black/[.1] top-0 left-0 rounded-[3px] z-[10] "
    />
    <h6 class="addressBalance mb-[12px]">
      Wallet Balance
    </h6>
    <h5
      class="addressBalance_amount mb-[5px]"
      :class="addressBalance? 'font-[500]' : 'font-[300]'"
    >
      {{ addressBalance ? addressBalance : '- - -' }}
    </h5>
    <div class="text-[12px] mb-[13px] text-blue-400">
      <!-- <span class=" font-[900]">{{ currentUserStake }}</span> ETH Currently Staked -->
    </div>
    <h6 class="card_title mb-[11px]">
      Wallet
    </h6>
    <div class="card_input text-black mb-[22px] relative">
      <button
        id="selectWalletInputButton"
        class="flex items-center justify-between gap-[8px] w-full h-full px-[10px] py-[14px]"
        :class="selectedWalletAddress ? 'text-black' : 'text-grey_4'"
        @click="openSelectWalletInput = !openSelectWalletInput"
      >
        <h6>
          {{ selectedWalletAddress ? convertString(selectedWalletAddress) : 'Select wallet' }}
        </h6>
        <vue-feather
          :type="openSelectWalletInput ? 'chevron-up' : 'chevron-down'"
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
            v-for="address in item.addresses"
            :key="address"
            class="w-full text-left rounded-[8px] py-[10px] px-[14px]
            hover:bg-grey_1 flex justify-between items-center text-grey_4 hover:text-grey_6"
            @click="selectedWalletAddress = address, openSelectWalletInput = false, selectedStakingProvider = item.provider"
          >
            {{ convertString(address) }}
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


    <button
      class="card_input text-black px-[10px] py-[14px] cursor-text"
      @click="selectAmountInput"
    >
      <div class="flex items-center gap-[8px]">
        <!-- <h6 class="text-[#667085]">
          $
        </h6> -->
        <input
          id="amount_input"
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
    </button>

    <!-- <p class="card_message">
      The amount to stake in set currency
    </p> -->

    <div class="flex justify-between items-center mt-[22px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Fees
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        <!-- {{ estimatedFees }}.00% -->
        5.00%
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
    <div class="flex justify-between items-center mb-[26px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Estimated APY
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        {{ estimatedAPY }}%
      </h6>
    </div>

    <div class="flex items-center gap-[18px] mb-[27px]">
      <input
        v-model="termsOfServiceCheckbox"
        type="checkbox"
        class="card_checkbox"
        @change="updateUserAgreement(termsOfServiceCheckbox)"
      >
      <button
        id="termsOfServiceButton"
        class="card_checkbox_text"
        @click="openTermsOfService = !openTermsOfService"
      >
        I agree to the terms of service
      </button>
    </div>

    <!-- Eigen Boggle -->
    <button
      ref="confettiButton"
      class="toggle_container"
      :disabled="!(termsOfServiceCheckbox && selectedWalletAddress && formattedAmountToStake && !errorMessage && !eigenDisabled)"
      @click="toggleShineEffect"
    >
      <img
        class="eigen_logo"
        src="/eigen.svg"
      >
      Enable EigenLayer
      <span
        v-if="isShining"
        class="shine_effect"
      />
      <div
        class="toggle_button"
        :style="{ 'background-color': toggleBackgroundColor }"
        :class="{ 'toggle-on': isToggled }"
        :disabled="!(termsOfServiceCheckbox && selectedWalletAddress && formattedAmountToStake && !errorMessage)"
      >
        <div class="toggle_circle" />
      </div>
    </button>

    <button
      class="card_button  h-[37px] w-full "
      :class="success ? 'bg-approve' : failure ? 'bg-decline' : 'bg-primary'"
      :disabled="!(termsOfServiceCheckbox && selectedWalletAddress && formattedAmountToStake && !errorMessage) || stakeButtonText !== 'Stake'"
      @click="handleDeposit()"
    >
      <div
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
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 6px, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

.addressBalance_amount {
  font-style: normal;
  font-size: 28px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #344054;
}

.addressBalance {
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
}

.card_container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
  border-radius: 3px;
}

.card_title {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  color: #344054;
}

.card_input {
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
  height: 44px;
  margin-top: 10px;
}

:disabled {
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

.card_checkbox_text {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 11px;
  line-height: 14px;
  letter-spacing: -0.01em;
  text-decoration-line: underline;
  color: #344054;
}

.card_checkbox {
  background: #FFFFFF;
  border: 1px solid #7F7889;
  box-shadow: 0px 0px 0px 4px rgba(237, 235, 255, 0.26);
  border-radius: 4px;
}

/* Eigen Button */
.toggle_container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 10px; /* space from the left edge */
  position: relative;
  width: 100%; /* takes full width of parent container */
  height: 44px; /* adjust as needed if required */
  background-color: rgb(26 12 109);
  overflow: hidden;
  text-align: center;
  color: #fff; /* or any suitable color for better visibility */
  font-size: 14px; /* adjust based on preference */
  border-radius: 8px;
  transition: background-color 0.3s; /* This will animate the color change */
}

.toggle_container:disabled {
    background-color: rgba(26, 12, 109, 0.5); /* This makes the purple color lighter (grayed out) */
    /* cursor: not-allowed; This changes the cursor to indicate the button is not clickable */
}

.shine_effect {
  content: '';
  position: absolute;
  top: -50%;
  left: -150%;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(30deg);
  pointer-events: none;
  animation: shine 2.5s infinite;
}

@keyframes shine {
  0% {
    left: -150%;
  }
  50% {
    left: 150%;
  }
  100% {
    left: 150%;
  }
}

.toggle_button {
  position: absolute;
  top: 50%;
  right: 10px; /* space from the right edge */
  transform: translateY(-50%);
  width: 50px;
  height: 25px;
  background-color: #eee;
  border-radius: 15px;
  cursor: pointer;
  overflow: hidden;
}

.card_container .toggle_container.toggle-on .toggle_button {
    background-color: green !important;
}

.toggle_circle {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background-color: #fff;
  border-radius: 50%;
  transition: left 0.3s;
}

.toggle-on .toggle_circle {
  left: calc(100% - 30px);
}

.eigen_logo {
  height: 20px;
  margin-right: 10px;
}

</style>@/composables/user@/composables/staking