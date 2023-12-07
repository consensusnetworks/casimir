<script lang="ts" setup>
import { computed, ref, onMounted, watch } from "vue"
import { FormattedWalletOption, ProviderString, StakeDetails } from "@casimir/types"
import VueFeather from "vue-feather"
import useEnvironment from "@/composables/environment"
import useEthers from "@/composables/ethers"
import useStaking from "@/composables/staking"
import useFormat from "@/composables/format"
import usePrice from "@/composables/price"
import useUser from "@/composables/user"
import useWallets from "@/composables/wallets"
import { ethers } from "ethers"
import TermsOfService from "@/components/TermsOfService.vue"

const { browserProvidersList } = useEthers()
const { batchProvider } = useEnvironment()
const { stakeWithdrawError, stakingComposableInitialized, userStakeDetails, deposit, withdraw, getWithdrawableBalance } = useStaking()
const { convertString, formatEthersCasimir, formatEthersCasimirStaking, parseEthersCasimir } = useFormat()
const { getCurrentPrice } = usePrice()
const { user, getPathIndex, updateUserAgreement } = useUser()
const { detectActiveWalletAddress } = useWallets()

// Staking Component Refs
const addressBalance = ref<string | null>(null)
const currentEthPrice = ref(0)
const stakeType = ref<"default" | "eigen">("default")
const currentUserStake = ref(0)
const estimatedFees = ref<number | string>("-")
const estimatedAPY = ref<string>("4.00")
const formattedAmountToStakeOrWithdraw = ref(0)
const formattedWalletOptions = ref<Array<FormattedWalletOption>>([])
const selectedStakingProvider = ref<ProviderString>("")
const selectedWalletAddress = ref(null as null | string)
const selectedUserAddressOperatorGroup = ref("")
const defaultUserStakeDetails = computed(() => userStakeDetails.value.filter((stakeDetail: StakeDetails) => stakeDetail.operatorType === "Default"))
// TODO: Re-enable this
const eigenUserStakeDetails = computed(() => userStakeDetails.value.filter((stakeDetail) => stakeDetail.operatorType === "Eigen"))
// Comment above and uncomment below to show Eigen Stake Withdrawal UI
// const eigenUserStakeDetails = ref<Array<StakeDetails>>([
//     {
//         address: "0xd557a5745d4560B24D36A68b52351ffF9c86A212".toLocaleLowerCase(),
//         amountStaked: 10.00,
//         operatorType: "Eigen",
//         availableToWithdraw: 4
//     },
//     {
//         address: "0x728474D29c2F81eb17a669a7582A2C17f1042b57".toLocaleLowerCase(),
//         amountStaked: 10.00,
//         operatorType: "Eigen",
//         availableToWithdraw: 4
//     }
// ])
const selectedOperatorGroupStakeDetails = ref<StakeDetails>()

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
const availableToWithdraw = computed(() => {
    if (!selectedOperatorGroupStakeDetails.value) return 0
    let result
    if (selectedOperatorGroupStakeDetails.value.amountStaked < selectedOperatorGroupStakeDetails.value.availableToWithdraw) {
        result = selectedOperatorGroupStakeDetails.value.amountStaked
    } else {
        result = selectedOperatorGroupStakeDetails.value.availableToWithdraw
    }
    return result
})
const withdrawalLimitExceeded = ref(false)

const casimirFormattedBalances = ref<{ [key: string]: string | null }>({})

async function fetchBalances() {
    const addresses = formattedWalletOptions.value.map((walletOption) => walletOption.addresses).flat()
    const balancePromises = addresses.map((address: string) => batchProvider.getBalance(address))
    const resolvedBalancePromises = await Promise.all(balancePromises)
    casimirFormattedBalances.value = resolvedBalancePromises.reduce((acc, balance, index) => {
        const formattedBalance = formatEthersCasimir(parseFloat(ethers.utils.formatEther(balance)), 2)
        acc[addresses[index]] = formattedBalance
        return acc
    }, {} as { [key: string]: string | null })
}

function toggleShineEffect() {
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

function selectAmountInput() {
    const inputElement = document.getElementById("amount_input") as HTMLInputElement
    if (inputElement) {
        inputElement.setSelectionRange(0, inputElement.value.length)
        inputElement.select() // For mobile devices
    }
}

function aggregateAddressesByProvider() {
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
        formattedAmountToStakeOrWithdraw.value = 0
        addressBalance.value = null
        currentUserStake.value = 0
    }
}

function handleOutsideClickForWalletInput(event: any) {
    const selectWalletInputContainer = document.getElementById("selectWalletInputContainer")
    const selectWalletInputButton = document.getElementById("selectWalletInputButton")

    if (!selectWalletInputContainer?.contains(event.target) && !selectWalletInputButton?.contains(event.target)) {
        openSelectWalletInput.value = false
    }
}

function handleOutsideClickForOperatorGroupInput(event: any) {
    const selectOperatorGroupInputContainer = document.getElementById("selectOperatorGroupInputContainer")
    const selectOperatorGroupInputButton = document.getElementById("selectOperatorGroupInputButton")

    if (!selectOperatorGroupInputContainer?.contains(event.target) && !selectOperatorGroupInputButton?.contains(event.target)) {
        openSelectOperatorGroupInput.value = false
    }
}

function handleOutsideClickForTermsOfService(event: any) {
    const termsOfServiceContainer = document.getElementById("termsOfServiceContainer")
    const termsOfServiceButton = document.getElementById("termsOfServiceButton")


    if (!termsOfServiceContainer?.contains(event.target) && !termsOfServiceButton?.contains(event.target)) {
        openTermsOfService.value = false
    }
}

function handleToggleStakeOrWithdraw(option: "stake" | "withdraw") {
    stakeOrWithdraw.value = option
    formattedAmountToStakeOrWithdraw.value = 0
    stakeButtonText.value = option === "stake" ? "Stake" : "Withdraw"
}

function handleSelectOperatorGroup(stakeDetail: StakeDetails) {
    selectedOperatorGroupStakeDetails.value = stakeDetail
    selectedUserAddressOperatorGroup.value = stakeDetail.address
}

function handleInputOnAmountToStakeOrWithdraw(event: any) {
    let value = event.target.value.replace(/[^\d.]/g, "")

    // Handling multiple decimal points by keeping only the first one
    const firstDecimalIndex = value.indexOf(".")
    if (firstDecimalIndex !== -1) {
        value = value.slice(0, firstDecimalIndex + 1) + value.slice(firstDecimalIndex).replace(/\./g, "")
    }

    const parts = value.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    // Limit to 18 decimal places
    if (parts[1] && parts[1].length > 18) {
        parts[1] = parts[1].slice(0, 18)
    }

    const formattedValue = parts.join(".")
    const numericValue = parseFloat(formattedValue.replace(/,/g, "")) // Convert back to float for comparison

    if (stakeOrWithdraw.value === "withdraw" && numericValue > availableToWithdraw.value) {
        withdrawalLimitExceeded.value = true
    } else {
        withdrawalLimitExceeded.value = false
    }

    // Update the model value for display
    formattedAmountToStakeOrWithdraw.value = formattedValue
}

async function handleStake() {
    let pathIndex = undefined
    stakeButtonText.value = "Staking..."
    eigenIsToggled.value = false

    // TODO: @DemogorGod - Should we check for active wallet here or in the staking.ts composable?
    if (browserProvidersList.includes(selectedWalletAddress.value as string)) {
        const activeAddress = await detectActiveWalletAddress(selectedStakingProvider.value)
        if (activeAddress !== selectedWalletAddress.value) {
            formattedAmountToStakeOrWithdraw.value = 0
            stakeButtonText.value = "Stake"
            return alert(`The account you selected is not the same as the one that is active in your ${selectedStakingProvider.value} wallet. Please open your ${selectedStakingProvider.value} browser extension select the account you want to use to stake.`)
        }
    } else {
        pathIndex = getPathIndex(selectedStakingProvider.value, selectedWalletAddress.value as string)
    }
    const depositPayload = {
        amount: formattedAmountToStakeOrWithdraw.value.toString(),
        walletProvider: selectedStakingProvider.value,
        type: stakeType.value,
        pathIndex: pathIndex !== undefined ? pathIndex : undefined
    }
    const result = await deposit(depositPayload)

    setTimeout(() => {
        stakeButtonText.value = "Stake"
        formattedAmountToStakeOrWithdraw.value = 0
    }, 1000)

    if (result) alert("Your Stake Has Been Deposited!")
}

async function handleWithdraw() {
    stakeButtonText.value = "Withdrawing..."
    selectedOperatorGroupStakeDetails.value = undefined

    // TODO: @DemogorGod - Should we check for active wallet here or in the staking.ts composable?
    const activeAddress = await detectActiveWalletAddress(selectedStakingProvider.value)
    if (activeAddress !== selectedWalletAddress.value) {
        formattedAmountToStakeOrWithdraw.value = 0
        stakeButtonText.value = "Withdraw"
        return alert(`The account you selected is not the same as the one that is active in your ${selectedStakingProvider.value} wallet. Please open your ${selectedStakingProvider.value} browser extension select the account you want to use to withdraw.`)
    }

    const withdrawableBalance = await getWithdrawableBalance({
        walletProvider: selectedStakingProvider.value,
        type: stakeType.value
    })

    if (parseFloat(withdrawableBalance) < formattedAmountToStakeOrWithdraw.value) {
        stakeButtonText.value = "Withdraw"
        formattedAmountToStakeOrWithdraw.value = 0
        return alert(`You can currently withdraw up to ${withdrawableBalance} ETH. Please try again with a smaller amount.`)
    }

    eigenIsToggled.value = false
    const confirmation = await withdraw({
        amount: formattedAmountToStakeOrWithdraw.value.toString(),
        walletProvider: selectedStakingProvider.value,
        type: stakeType.value
    })

    if (!confirmation) stakeButtonText.value = "Failed!"
    else stakeButtonText.value = "Withdrawn!"

    setTimeout(() => {
        stakeButtonText.value = "Withdraw"
        formattedAmountToStakeOrWithdraw.value = 0
    }, 1000)

    if (confirmation) alert("Your Stake Has Been Withdrawn!")
}

watch(formattedWalletOptions, async () => {
    await fetchBalances()
})

watch(openSelectWalletInput, () => {
    if (openSelectWalletInput.value) {
        window.addEventListener("click", handleOutsideClickForWalletInput)
    } else {
        window.removeEventListener("click", handleOutsideClickForWalletInput)
    }
})

watch(openSelectOperatorGroupInput, () => {
    if (openSelectWalletInput.value) {
        window.addEventListener("click", handleOutsideClickForOperatorGroupInput)
    } else {
        window.removeEventListener("click", handleOutsideClickForOperatorGroupInput)
    }
})

watch(openTermsOfService, () => {
    if (openTermsOfService.value) {
        window.addEventListener("click", handleOutsideClickForTermsOfService)
    } else {
        window.removeEventListener("click", handleOutsideClickForTermsOfService)
    }
})

watch(formattedAmountToStakeOrWithdraw, async () => {
    if (formattedAmountToStakeOrWithdraw.value === 0) errorMessage.value = null
    const floatAmount = parseFloat(formattedAmountToStakeOrWithdraw.value.toString().replace(/,/g, ""))

    const selectedAddressBalance = parseEthersCasimir(casimirFormattedBalances.value[selectedWalletAddress.value as string] as string)
    const maxAmount = selectedWalletAddress.value ? selectedAddressBalance : 0

    if (stakeOrWithdraw.value === "stake" && floatAmount > maxAmount) {
        errorMessage.value = "Insufficient Funds"
    } else {
        errorMessage.value = null
    }
})

watch(selectedWalletAddress, async () => {
    if (!stakingComposableInitialized.value) return
    if (selectedWalletAddress.value) {
    // addressBalance.value = (Math.round(await getEthersBalance(selectedWalletAddress.value) * 100) / 100) + " ETH"
        isShining.value = true
    // currentUserStake.value = await getUserStake(selectedWalletAddress.value)
    } else {
        addressBalance.value = null
    // currentUserStake.value = 0
    }
})

watch(stakeWithdrawError, () => {
    if (stakeWithdrawError.value === "") return
    if (stakeWithdrawError.value === "user rejected transaction") {
        alert("User rejected transaction. Try again and confirm signature.")
        setTimeout(() => {
            stakeOrWithdraw.value === "stake" ? stakeButtonText.value = "Stake" : stakeButtonText.value = "Withdraw"
        }, 2000)
    } else {
        // TODO: Determine other errors to handle and handle here.
        alert("Stake failed. Try again later.")
        setTimeout(() => {
            stakeOrWithdraw.value === "stake" ? stakeButtonText.value = "Stake" : stakeButtonText.value = "Withdraw"
        }, 2000)
    }
})

watch(user, async () => {
    if (user.value?.id) {
        aggregateAddressesByProvider()
        termsOfServiceCheckbox.value = user.value?.agreedToTermsOfService as boolean
        selectedWalletAddress.value = user.value?.address as string
        selectedStakingProvider.value = user.value?.walletProvider as ProviderString
    } else {
        selectedStakingProvider.value = ""
        selectedWalletAddress.value = null
        formattedAmountToStakeOrWithdraw.value = 0
        addressBalance.value = null
    }
})

onMounted(async () => {
    aggregateAddressesByProvider()
    currentEthPrice.value = Math.round((await getCurrentPrice({ coin: "ETH", currency: "USD" })) * 100) / 100
    if (user.value?.id) {
        // estimatedFees.value = await getDepositFees()
        selectedStakingProvider.value = user.value?.walletProvider as ProviderString
        selectedWalletAddress.value = user.value?.address as string
        if (!stakingComposableInitialized.value) return
        isShining.value = true
    }
})
</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full relative">
    <!-- Stake | Withdraw Selector -->
    <div class="stake-withdraw-selector mt-[12px] mb-[12px]">
      <div
        class="action-button stake"
        :class="{ active: stakeOrWithdraw === 'stake' }"
        @click="handleToggleStakeOrWithdraw('stake')"
      >
        Stake
      </div>
      <div
        class="action-button withdraw"
        :class="{ active: stakeOrWithdraw === 'withdraw' }"
        @click="handleToggleStakeOrWithdraw('withdraw')"
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
    <span v-if="stakeOrWithdraw === 'stake'">
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
              <span>{{ casimirFormattedBalances[address] !== null ? `~${casimirFormattedBalances[address]} ETH` : 'Loading...' }}</span>
            <!-- <vue-feather
              type="chevron-right"
              size="36"
              class="icon w-[20px]"
            /> -->
            </button>
          </div>
        </div>
      </div>
    </span>

    <!-- Select Staked Operator Group -->
    <span v-else>
      <ul class="max-h-[260px] overflow-scroll">
        <span v-if="defaultUserStakeDetails.length">
          <h6 class="card_title">Default Stakes</h6>
          <li 
            v-for="(stakeDetail, index) in defaultUserStakeDetails"
            :key="index"
            :class="[
              'operator_group_li', 
              { 'selected_operator_group_li': 
                selectedOperatorGroupStakeDetails ? selectedOperatorGroupStakeDetails.operatorType === stakeDetail.operatorType && selectedUserAddressOperatorGroup === stakeDetail.address : false
              }
            ]"
            @click="handleSelectOperatorGroup(stakeDetail)"
          >
            <div class="p-2 flex">
              <img
                :src="`${user?.accounts.filter(account => account.address === stakeDetail.address)[0].walletProvider.toLocaleLowerCase()}.svg`"
                class="w-[16px] h-[16px] inline-block mr-[8px]"
              > {{ convertString(stakeDetail.address) }}</div>
            <div class="p-2">{{ formatEthersCasimirStaking(stakeDetail.amountStaked) }} ETH</div>
          </li>
        </span>

        <span v-if="eigenUserStakeDetails.length">
          <h6 class="card_title py-8">Eigen Stakes</h6>
          <li 
            v-for="(stakeDetail, index) in eigenUserStakeDetails"
            :key="index"
            :class="[
              'operator_group_li', 
              { 'selected_operator_group_li': 
                selectedOperatorGroupStakeDetails ? selectedOperatorGroupStakeDetails.operatorType === stakeDetail.operatorType && selectedUserAddressOperatorGroup === stakeDetail.address : false
              }
            ]"
            @click="handleSelectOperatorGroup(stakeDetail)"
          >
            <div class="p-2">
              <img
                :src="`${user?.accounts.filter(account => account.address === stakeDetail.address)[0].walletProvider.toLocaleLowerCase()}.svg`"
                class="w-[16px] h-[16px] inline-block mr-[8px]"
              > 
              {{ convertString(stakeDetail.address) }}</div>
            <div class="p-2">{{ formatEthersCasimirStaking(stakeDetail.amountStaked) }} ETH</div>
          </li>
        </span>
      </ul>
    </span>

    <!-- Amount to Stake/Withdraw -->
    <div class="flex justify-between items-center gap-[8px] mb-[11px] mt-[8px]">
      <h6 class="card_title">
        Amount
      </h6>

      <span class="text-[12px] font-[600] leading-[20px] text-h text-red-500">
        {{ errorMessage }}
      </span>
    </div>

    <!-- Stake Amount -->
    <button
      v-if="stakeOrWithdraw === 'stake'"
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
    
    <!-- Withdraw Amount -->
    <button
      v-if="stakeOrWithdraw === 'withdraw'"
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
          :disabled="!selectedOperatorGroupStakeDetails"
          @input="handleInputOnAmountToStakeOrWithdraw"
        >
      </div>
      <div class="flex items-center gap-[4px]">
        <h6 style="font-weight: 400;">
          ETH
          <button
            class="text-[12px] text-blue-500 ml-6"
            @click="formattedAmountToStakeOrWithdraw = availableToWithdraw"
          >
            Max
          </button>
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

    <!-- Available to Withdraw Note -->
    <div
      v-if="stakeOrWithdraw === 'withdraw' && selectedOperatorGroupStakeDetails"
    >
      <div class="max_withdraw_note_container">
        <div class="tooltip_container">
          Withdrawals are currently limited to available balance that is not actively staked on Beacon Chain.
          <br>
          We will adding capability to make full withdrawals soon.
          <div class="tooltip_triangle" />
        </div>
        <div
          :class="[
            'card_message p-2 text-blue-500 cursor-default',
            { 'card_message_error': withdrawalLimitExceeded }
          ]"
        >
          Your current withdrawable amount is: {{ formatEthersCasimirStaking(availableToWithdraw) }} ETH
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <button
      class="submit-button  h-[37px] w-full"
      :class="success ? 'bg-approve' : failure ? 'bg-decline' : 'bg-primary'"
      :disabled="!(selectedWalletAddress && formattedAmountToStakeOrWithdraw && !errorMessage)
        || (stakeButtonText !== 'Stake' && stakeButtonText !== 'Withdraw')
        || formattedAmountToStakeOrWithdraw <= 0
        || (stakeOrWithdraw === 'stake' && !termsOfServiceCheckbox)
        || (stakeOrWithdraw === 'withdraw' && withdrawalLimitExceeded)
      "
      @click="stakeOrWithdraw === 'stake' ? handleStake() : handleWithdraw()"
    >
      <div class="flex items-center justify-center gap-[5px]">
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
  font-size: 22px;
  /* Temporary */
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
  /* color: #667085; */
}

.card_message_error {
  color: #FF0000;
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

button:disabled {
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
  padding-left: 10px;
  /* space from the left edge */
  position: relative;
  width: 100%;
  /* takes full width of parent container */
  height: 44px;
  /* adjust as needed if required */
  background-color: rgb(26 12 109);
  /* overflow: hidden; */
  text-align: center;
  color: #fff;
  /* or any suitable color for better visibility */
  font-size: 14px;
  border-radius: 8px;
  transition: background-color 0.3s;
  /* This will animate the color change */
}

.eigen-toggle-container:disabled {
  background-color: rgba(26, 12, 109, 0.5);
  /* This makes the purple color lighter (grayed out) */
  /* cursor: not-allowed; This changes the cursor to indicate the button is not clickable */
}

.toggle_button {
  position: absolute;
  top: 50%;
  right: 10px;
  /* space from the right edge */
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
  bottom: 100%;
  /* position it above the button */
  left: 50%;
  /* center it horizontally */
  transform: translateX(-50%);
  /* shift it back by half its width to truly center it */
  padding: 8px 12px;
  /* space around the text */
  background-color: #000;
  /* or any desired tooltip color */
  color: #fff;
  /* text color */
  border-radius: 4px;
  /* round the corners */
  opacity: 0;
  /* starts hidden */
  transition: opacity 0.3s;
  /* smooth fade in */
  white-space: nowrap;
  /* prevents the text from wrapping */
  font-size: 14px;
  pointer-events: none;
  /* ensures it doesn't block any interactions */
  z-index: 10;
  /* positions it above other elements */
}

.tooltip_triangle {
  position: absolute;
  bottom: -5px;
  /* position at the bottom of the tooltip */
  left: 50%;
  /* center it horizontally */
  transform: translateX(-50%);
  /* shift it back by half its width to truly center it */
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #000;
  /* same color as the tooltip background */
}

.eigen-toggle-container:hover .tooltip_container {
  opacity: 1;
  /* show on hover */
}

.max_withdraw_note_container {
  position: relative;
}
.max_withdraw_note_container:hover .tooltip_container {
  opacity: 1;
  /* show on hover */
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
  color: rgb(13, 95, 255);
}

.action-button.active {
  color: rgb(13, 95, 255);
  border: solid 1px rgb(13, 95, 255);
  background-color: #F3F3F3;
}

.operator_group_li {
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  color: #6B7280;
  font-size: 12px;
  padding: 6px;
  margin: 6px 0;
  cursor: pointer;
}

.operator_group_li:hover {
  background-color: #F3F3F3;
}

.selected_operator_group_li {
  /* Border should become blue */
  border: 1px solid rgb(13, 95, 255);
  background-color: #F3F3F3;
}
</style>@/composables/user@/composables/staking