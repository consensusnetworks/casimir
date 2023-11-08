<script lang="ts" setup>
import { computed, ref, onMounted, watch } from "vue"
import { FormattedWalletOption, ProviderString } from "@casimir/types"
import VueFeather from "vue-feather"
import useStaking from "@/composables/staking"
import useEthers from "@/composables/ethers"
import useFormat from "@/composables/format"
import usePrice from "@/composables/price"
import useUser from "@/composables/user"

import TermsOfService from "@/components/TermsOfService.vue"

const { stakingComposableInitialized, deposit, initializeStakingComposable, withdraw, getWithdrawableBalance } = useStaking()
const { getEthersBalance } = useEthers()
const { convertString, formatNumber } = useFormat()
const { getCurrentPrice } = usePrice()
const { user, updateUserAgreement } = useUser()

// Staking Component Refs
const addressBalance = ref<string | null>(null)
const currentEthPrice = ref(0)
const stakeType = ref<"default" | "eigen">("default")
const currentUserStake = ref(0)
const estimatedFees = ref<number | string>("-")
const estimatedAPY = ref<string>("4.00")
const formattedAmountToStakeOrWithdraw = ref("")
const formattedWalletOptions = ref<Array<FormattedWalletOption>>([])
const selectedStakingProvider = ref<ProviderString>("")
const selectedWalletAddress = ref(null as null | string)
const selectedOperatorGroup = ref(null as null | "Default" | "Eigen")

// Wallet Select Refs
const errorMessage = ref(null as null | string)
const openSelectWalletInput = ref(false)
const openSelectOperatorGroupInput = ref(false)
const openTermsOfService = ref(false)
const termsOfServiceCheckbox = ref(false)

// Staking Action Loader Refs
const loading = ref(false)
const stakeButtonText = ref("Stake")
const stakingActionLoader = ref(false)
const success = ref(false)
const failure = ref(false)

const stakeOrWithdraw = ref<"stake" | "withdraw">("stake")
const eigenDisabled = ref(true) // Keeps eigen disabled until Casimir is ready to support it.
const isShining = ref(true) // Determines if the shine effect is active
const eigenIsToggled = ref(false) // Determines the toggle state
const toggleBackgroundColor = ref("#eee")  // Initial color

const balances = ref<{ [key: string]: string | null }>({})

const fetchBalances = async () => {
    const balancePromises = formattedWalletOptions.value.map(async (walletOption) => {
        for (const address of walletOption.addresses) {
            balances.value[address] = formatNumber(await getEthersBalance(address))
        }
    })

    await Promise.all(balancePromises)
}

watch(formattedWalletOptions, async () => {
    await fetchBalances()
})

// const walletOptionsWithBalances = computed(() => {
//   return formattedWalletOptions.value.map(walletOption => ({
//     ...walletOption,
//     addresses: walletOption.addresses.map(address => ({
//       address,
//       balance: balances.value[address]
//     }))
//   }))
// })

const toggleShineEffect = () => {
    eigenIsToggled.value = !eigenIsToggled.value
    isShining.value = eigenIsToggled.value
    // toggleEstimatedAPY()

    // Change the color based on the toggle state
    toggleBackgroundColor.value = eigenIsToggled.value ? "green" : "#eee"

    // Update stakeType
    stakeType.value = eigenIsToggled.value ? "eigen" : "default"
}

function toggleEstimatedAPY() {
    if (estimatedAPY.value === "5.50") {
        estimatedAPY.value = "10.00"
    } else {
        estimatedAPY.value = "5.50"
    }
}

const handleInputOnAmountToStakeOrWithdraw = (event: any) => {
    const value = event.target.value.replace(/[^\d.]/g, "")
    const parts = value.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    // Limit to 18 decimal places
    if (parts[1] && parts[1].length > 18) {
        parts[1] = parts[1].slice(0, 18)
    }

    // Update the model value
    formattedAmountToStakeOrWithdraw.value = parts.join(".")
}

const selectAmountInput = () => {
    const inputElement = document.getElementById("amount_input") as HTMLInputElement
  
    if (inputElement) {

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
        selectedStakingProvider.value = ""
        selectedWalletAddress.value = null
        formattedAmountToStakeOrWithdraw.value = ""
        addressBalance.value = null
        currentUserStake.value = 0
    }
}

watch(formattedAmountToStakeOrWithdraw, async () => {
    if (formattedAmountToStakeOrWithdraw.value) {
        const floatAmount = parseFloat(formattedAmountToStakeOrWithdraw.value?.replace(/,/g, ""))
        let maxAmount
        if (selectedWalletAddress.value) {
            maxAmount = await getEthersBalance(selectedWalletAddress.value)
        } else {
            maxAmount = 0
        }

        if (floatAmount > maxAmount) {
            errorMessage.value = "Insufficient Funds"
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
        addressBalance.value = (Math.round(await getEthersBalance(selectedWalletAddress.value) * 100) / 100) + " ETH"
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
        addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + " ETH"
        selectedWalletAddress.value = user.value?.address as string
        selectedStakingProvider.value = user.value?.walletProvider as ProviderString
    // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
    // estimatedFees.value = await getDepositFees()
    } else {
        selectedStakingProvider.value = ""
        selectedWalletAddress.value = null
        formattedAmountToStakeOrWithdraw.value = ""
        addressBalance.value = null
    // currentUserStake.value = 0
    }
})

onMounted(async () => {
    // TODO: @ccali11 - Want to make sure this is non-blocking
    await initializeStakingComposable()
    aggregateAddressesByProvider()
    currentEthPrice.value = Math.round((await getCurrentPrice({ coin: "ETH", currency: "USD" })) * 100) / 100
    if (user.value?.id) {
    // estimatedFees.value = await getDepositFees()
        addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + " ETH"
        selectedStakingProvider.value = user.value?.walletProvider as ProviderString
        selectedWalletAddress.value = user.value?.address as string
        if (!stakingComposableInitialized.value) return
        // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
        isShining.value = true
    }
    await fetchBalances()
})

const handleOutsideClickForWalletInput = (event: any) => {
    const selectWalletInputContainer = document.getElementById("selectWalletInputContainer")
    const selectWalletInputButton = document.getElementById("selectWalletInputButton")

    if (!selectWalletInputContainer?.contains(event.target) && !selectWalletInputButton?.contains(event.target)) {
        openSelectWalletInput.value = false
    }
}

const handleOutsideClickForOperatorGroupInput = (event: any) => {
    const selectOperatorGroupInputContainer = document.getElementById("selectOperatorGroupInputContainer")
    const selectOperatorGroupInputButton = document.getElementById("selectOperatorGroupInputButton")

    if (!selectOperatorGroupInputContainer?.contains(event.target) && !selectOperatorGroupInputButton?.contains(event.target)) {
        openSelectOperatorGroupInput.value = false
    }
}

const handleOutsideClickForTermsOfService = (event: any) => {
    const termsOfServiceContainer = document.getElementById("termsOfServiceContainer")
    const termsOfServiceButton = document.getElementById("termsOfServiceButton")


    if (!termsOfServiceContainer?.contains(event.target) && !termsOfServiceButton?.contains(event.target)) {
        openTermsOfService.value = false
    }
}

watch(openSelectWalletInput, ()=>{
    if (openSelectWalletInput.value) {
        window.addEventListener("click", handleOutsideClickForWalletInput)
    } else {
        window.removeEventListener("click", handleOutsideClickForWalletInput)
    }
})

watch(openSelectOperatorGroupInput, ()=>{
    if (openSelectWalletInput.value) {
        window.addEventListener("click", handleOutsideClickForOperatorGroupInput)
    } else {
        window.removeEventListener("click", handleOutsideClickForOperatorGroupInput)
    }
})

watch(openTermsOfService, ()=>{
    if (openTermsOfService.value) {
        window.addEventListener("click", handleOutsideClickForTermsOfService)
    } else {
        window.removeEventListener("click", handleOutsideClickForTermsOfService)
    }
})

const handleStake = async () => {
    stakeButtonText.value = "Staking..."

    // const activeAddress = await detectActiveWalletAddress(selectedStakingProvider.value)
    // if (activeAddress !== selectedWalletAddress.value) {
    //   formattedAmountToStakeOrWithdraw.value = ''
    //   return alert(`The account you selected is not the same as the one that is active in your ${selectedStakingProvider.value} wallet. Please open your browser extension and select the account that you want to log in with.`)
    // }
    const result = await deposit({ 
        amount: formattedAmountToStakeOrWithdraw.value,
        walletProvider: selectedStakingProvider.value,
        type: stakeType.value 
    })

    if (result === false) stakeButtonText.value = "User Rejected Signature"
    else stakeButtonText.value = "Staked!"

    setTimeout(() =>{
        stakeButtonText.value = "Stake"
        formattedAmountToStakeOrWithdraw.value = ""
    }, 1000)

    if (result) {
        const waitResponse = await result.wait(1)
        eigenIsToggled.value = false
        addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + " ETH"
        if (waitResponse) {
            alert("Your Stake Has Been Deposited!")
        } else {
            alert("Your Stake Action Has Failed, Please Try Again Later!")
        }
        console.log("waitResponse :>> ", waitResponse)
    }

    // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
}

const handleWithdraw = async () => {
    stakeButtonText.value = "Withdrawing..."
    selectedOperatorGroup.value = null
    // const activeAddress = await detectActiveWalletAddress(selectedStakingProvider.value)
    // if (activeAddress !== selectedWalletAddress.value) {
    //   formattedAmountToStakeOrWithdraw.value = ''
    //   return alert(`The account you selected is not the same as the one that is active in your ${selectedStakingProvider.value} wallet. Please open your browser extension and select the account that you want to log in with.`)
    // }

    const withdrawableBalance = await getWithdrawableBalance({
        walletProvider: selectedStakingProvider.value,
        type: stakeType.value
    })
  
    if (parseFloat(withdrawableBalance) < parseFloat(formattedAmountToStakeOrWithdraw.value)) {
        stakeButtonText.value = "Withdraw"
        formattedAmountToStakeOrWithdraw.value = ""
        return alert(`You can currently withdraw up to ${withdrawableBalance} ETH. Please try again with a smaller amount.`)
    }

    const result = await withdraw({ 
        amount: formattedAmountToStakeOrWithdraw.value,
        walletProvider: selectedStakingProvider.value,
        type: stakeType.value 
    })

    if (!result) stakeButtonText.value = "Failed!"
    else stakeButtonText.value = "Withdrawn!"

    setTimeout(() =>{
        stakeButtonText.value = "Withdraw"
        formattedAmountToStakeOrWithdraw.value = ""
    }, 1000)

    if (result) {
        const waitResponse = await result.wait(1)
        eigenIsToggled.value = false
        addressBalance.value = (Math.round(await getEthersBalance(user.value?.address as string) * 100) / 100) + " ETH"
        if (waitResponse) {
            alert("Your Stake Has Been Withdrawn!")
        } else {
            alert("Your Stake Action Has Failed, Please Try Again Later!")
        }
    }

    // currentUserStake.value = await getUserStake(selectedWalletAddress.value as string)
}

function setStakeOrWithdraw(option: "stake" | "withdraw") {
    stakeOrWithdraw.value = option
    formattedAmountToStakeOrWithdraw.value = ""
    stakeButtonText.value = option === "stake" ? "Stake" : "Withdraw"
}
</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full relative">
    <!-- Stake | Withdraw Selector -->
    <div class="stake-withdraw-selector mt-[12px] mb-[12px]">
      <div
        class="action-button stake"
        :class="{active: stakeOrWithdraw === 'stake'}"
        @click="setStakeOrWithdraw('stake')"
      >
        Stake
      </div>
      <div
        class="action-button withdraw"
        :class="{active: stakeOrWithdraw === 'withdraw'}"
        @click="setStakeOrWithdraw('withdraw')"
      >
        Withdraw
      </div>
    </div>

    <div
      v-if="stakingActionLoader"
      class="absolute w-full h-full bg-black/[.1] top-0 left-0 rounded-[3px] z-[10]"
    />
    <div class="text-[12px] mb-[13px] text-blue-400" />

    <!-- Select Wallet Address -->
    <h6 class="card_title my-[11px]">
      Wallet
    </h6>
    <div class="card_input text-black mb-[22px] relative">
      <button
        id="selectWalletInputButton"
        class="flex items-center justify-between gap-[8px] w-full h-full px-[10px] py-[14px]"
        :class="selectedWalletAddress ? 'text-black' : 'text-grey_4'"
        @click="openSelectWalletInput = !openSelectWalletInput"
      >
        <div class="flex justify-between w-full">
          <div>{{ selectedWalletAddress ? convertString(selectedWalletAddress) : 'Select wallet' }}</div> 
          <div class="flex gap-10 font-[400]">
            {{ addressBalance ? addressBalance : '' }}
            <vue-feather
              :type="openSelectWalletInput ? 'chevron-up' : 'chevron-down'"
              size="36"
              class="icon w-[20px]"
            />
          </div>
        </div>
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
            <span>{{ convertString(address) }}</span>
            <span>{{ balances[address] !== null ? `~${balances[address]} ETH` : 'Loading...' }}</span>
            <!-- <vue-feather
              type="chevron-right"
              size="36"
              class="icon w-[20px]"
            /> -->
          </button>
        </div>
      </div>
    </div>

    <!-- Amount to Stake/Withdraw -->
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
        <input
          id="amount_input"
          v-model="formattedAmountToStakeOrWithdraw"
          type="text"
          pattern="^\d{1,3}(,\d{3})*(\.\d{1,18})?$"
          placeholder="0.00"
          class="outline-none"
          @input="handleInputOnAmountToStakeOrWithdraw"
        >
      </div>
      <div class="flex items-center gap-[4px]">
        <h6 style="font-weight: 400;">
          ETH
        </h6>
      </div>
    </button>

    <!-- Fees, Exchange Rate, Estimated APY (for stake only)-->
    <div v-if="stakeOrWithdraw === 'stake'">
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
    </div>

    <!-- Operator Group Selector (for withdraw only) -->
    <div
      v-else
      class="my-[22px]"
    >
      <h6 class="card_title my-[11px]">
        Operator Group
      </h6>
      <div class="card_input text-black mb-[22px] relative">
        <button
          id="selectOperatorGroupInputButton"
          class="flex items-center justify-between gap-[8px] w-full h-full px-[10px] py-[14px]"
          :class="selectedOperatorGroup ? 'text-black' : 'text-grey_4'"
          @click="openSelectOperatorGroupInput = !openSelectOperatorGroupInput"
        >
          <div class="flex justify-between w-full">
            <div>{{ selectedOperatorGroup ? selectedOperatorGroup : 'Select Operator Group' }}</div> 
            <div class="flex gap-10 font-[400]">
              <!-- {{ addressBalance ? addressBalance : '' }} -->
              <!-- TODO: This needs to be the amount available to withdraw -->
              <vue-feather
                :type="openSelectOperatorGroupInput ? 'chevron-up' : 'chevron-down'"
                size="36"
                class="icon w-[20px]"
              />
            </div>
          </div>
        </button>
        <div
          v-show="openSelectOperatorGroupInput"
          id="selectOperatorGroupInputContainer"
          class="absolute top-[110%] w-full bg-white rounded-[8px] border border-[#D0D5DD] px-[10px] py-[8px] max-h-[250px] overflow-auto"
        >
          <!-- TODO: Update this to only show if user has staked -->
          <!-- <div
            class="flex justify-center items-center text-grey_4 py-[10px]"
          >
            Nothing to withdraw
          </div> -->
          <!-- TODO: Update this to iterate over the contracts user has staked to -->
          <div
            id="selectOperatorGroupOptionsCard"
            class="mt-[5px] mb-[10px]"
          >
            <button
              class="w-full text-left rounded-[8px] py-[10px] px-[14px]
            hover:bg-grey_1 flex justify-between items-center text-grey_4 hover:text-grey_6"
              @click="selectedOperatorGroup = 'Default', openSelectOperatorGroupInput = false, stakeType='default'"
            >
              Default
              <vue-feather
                type="chevron-right"
                size="36"
                class="icon w-[20px]"
              />
            </button>
            <button
              class="w-full text-left rounded-[8px] py-[10px] px-[14px]
            hover:bg-grey_1 flex justify-between items-center text-grey_4 hover:text-grey_6"
              @click="selectedOperatorGroup = 'Eigen', openSelectOperatorGroupInput = false, stakeType='eigen'"
            >
              Eigen
              <vue-feather
                type="chevron-right"
                size="36"
                class="icon w-[20px]"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Terms of Service -->
    <div
      v-if="stakeOrWithdraw === 'stake'"
      class="flex items-center gap-[18px] mb-[27px]"
    >
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
      v-if="stakeOrWithdraw === 'stake'"
      class="eigen-toggle-container mb-[12px]"
      :disabled="!(termsOfServiceCheckbox && selectedWalletAddress && formattedAmountToStakeOrWithdraw && !errorMessage && !eigenDisabled)"
      @click="toggleShineEffect"
    >
      <div class="tooltip_container">
        Coming Soon!
        <div class="tooltip_triangle" />
      </div>

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
        :class="{ 'toggle-on': eigenIsToggled }"
        :disabled="!(termsOfServiceCheckbox && selectedWalletAddress && formattedAmountToStakeOrWithdraw && !errorMessage)"
      >
        <div class="toggle_circle" />
      </div>
    </button>

    <!-- Submit Button -->
    <button
      class="submit-button  h-[37px] w-full"
      :class="success ? 'bg-approve' : failure ? 'bg-decline' : 'bg-primary'"
      :disabled="
        !(selectedWalletAddress && formattedAmountToStakeOrWithdraw && !errorMessage) 
          || (stakeButtonText !== 'Stake' && stakeButtonText !== 'Withdraw') 
          || parseFloat(formattedAmountToStakeOrWithdraw) <= 0 
          || (stakeOrWithdraw === 'stake' && !termsOfServiceCheckbox)
      "
      @click="stakeOrWithdraw === 'stake' ? handleStake() : handleWithdraw()"
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
  font-size: 22px; /* Temporary */
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
  min-height: 542px;
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

.submit-button {
  /* background: #0F6AF2; */
  position: absolute;
  bottom: 20px;
  max-width: 256px;
  border-radius: 5px;
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.03em;
  color: #FFFFFF;
  height: 44px;
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
.eigen-toggle-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 10px; /* space from the left edge */
  position: relative;
  width: 100%; /* takes full width of parent container */
  height: 44px; /* adjust as needed if required */
  background-color: rgb(26 12 109);
  /* overflow: hidden; */
  text-align: center;
  color: #fff; /* or any suitable color for better visibility */
  font-size: 14px;
  border-radius: 8px;
  transition: background-color 0.3s; /* This will animate the color change */
}

.eigen-toggle-container:disabled {
    background-color: rgba(26, 12, 109, 0.5); /* This makes the purple color lighter (grayed out) */
    /* cursor: not-allowed; This changes the cursor to indicate the button is not clickable */
}

/* .shine_effect {
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
} */

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

.card_container .eigen-toggle-container.toggle-on .toggle_button {
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

.tooltip_container {
  position: absolute;
  bottom: 100%; /* position it above the button */
  left: 50%; /* center it horizontally */
  transform: translateX(-50%); /* shift it back by half its width to truly center it */
  padding: 8px 12px; /* space around the text */
  background-color: #000; /* or any desired tooltip color */
  color: #fff; /* text color */
  border-radius: 4px; /* round the corners */
  opacity: 0; /* starts hidden */
  transition: opacity 0.3s; /* smooth fade in */
  white-space: nowrap; /* prevents the text from wrapping */
  font-size: 12px;
  pointer-events: none; /* ensures it doesn't block any interactions */
  z-index: 10; /* positions it above other elements */
}

.eigen-toggle-container:hover .tooltip_container {
  opacity: 1; /* show on hover */
}

.tooltip_triangle {
  position: absolute;
  bottom: -5px; /* position at the bottom of the tooltip */
  left: 50%; /* center it horizontally */
  transform: translateX(-50%); /* shift it back by half its width to truly center it */
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #000; /* same color as the tooltip background */
}

.stake-withdraw-selector {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
}

.action-button {
  font-size: 14px;
  padding: 8px 36px;
  background-color: white;
  cursor: pointer;
  border: 1px solid #D0D5DD;
  transition: background-color 0.3s;
}

.action-button.stake {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    border-right: none;
}

.action-button.withdraw {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    border-left: none;
}

.action-button:hover {
    background-color: #ddd;
}

.action-button.active {
    background-color: rgb(13, 95, 255); /* Assuming this is the blue from the screenshot */
    color: white; /* Set text color to white for better contrast */
}

</style>@/composables/user@/composables/staking