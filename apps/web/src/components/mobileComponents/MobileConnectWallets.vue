<script lang="ts" setup>
import { ref } from 'vue'
import useWallet from '@/composables/wallet'
import Carousel from '@/components/Carousel.vue'
import Slide from '@/components/Slide.vue'
import VueFeather from 'vue-feather'
import TermsOfService from '@/components/TermsOfService.vue'
const  {
  activeWallets,
  walletProviderAddresses,
  selectAddress,
  selectProvider,
} = useWallet()

const authFlowCardNumber = ref(1)

const selectedProivder = ref(null as null | string)

const termsCheckbox = ref(true)
const showTermsOfService = ref(false)
const convertString = (inputString: string) => {
  if (inputString.length <= 4) {
    return inputString
  }

  var start = inputString.substring(0, 4)
  var end = inputString.substring(inputString.length - 4)
  var middle = '*'.repeat(4)

  return start + middle + end
}
</script>

<template>
  <div
    class="h-full w-full bg-white overflow-auto relative"
  >
    <Carousel
      v-slot="{currentSlide}"
      :current-slide="authFlowCardNumber"
      class="w-full h-full relative"
    >
      <Slide class="">
        <div
          v-show="currentSlide === 1"
          class="absolute top-0 left-0 w-full h-full px-[20px] pt-[15px] pb-[50px]"
        >
          <h6 class="">
            Select Provider
          </h6>

          <div class="flex flex-wrap justify-between gap-[20px] w-full mt-[20px]">
            <button
              v-for="wallet in activeWallets"
              :key="wallet"
              class="w-[140px] h-[100px] border flex flex-col justify-center items-center rounded-[8px]"
              @click="selectProvider(wallet, 'ETH'), authFlowCardNumber = 2, selectedProivder = wallet"
            >
              <img
                :src="`/${wallet.toLowerCase()}.svg`"
                :alt="`${wallet} logo`"
                class="w-[32px] h-[32px] rounded-[999px] mb-[10px]"
              >
              <h6>
                {{ wallet }}
              </h6>
            </button>
          </div> 
        </div>
      </Slide>
      <Slide class="">
        <div
          v-show="currentSlide === 2"
          class="absolute top-0 left-0 w-full h-full px-[20px] pt-[15px] pb-[70px]"
        >
          <h6 class="flex items-center mb-[20px]">
            <button @click="authFlowCardNumber = 1, selectedProivder = null">
              <vue-feather
                type="chevron-left"
                class="icon w-[20px] h-min text-primary hover:text-blue_3 mr-[10px] mt-[5px]"
              />
            </button>
            Select Address
          </h6>

         
          <div
            v-if="walletProviderAddresses.length === 0"
            class="flex items-center justify-center h-[90%] border border rounded-[8px]"
          >
            <h6 class="">
              Waiting on {{ selectedProivder }}...
            </h6>
          </div>
          <div v-else>
            <button
              v-for="act in walletProviderAddresses"
              :key="act.address"
              class="w-full border rounded-[8px] px-[10px] py-[15px] flex items-center justify-between hover:border-blue_3 mb-[10px]"
              @click="selectAddress(act.address), authFlowCardNumber = 1"
            >
              <div>
                {{ convertString(act.address) }}
              </div>
              <div>
                {{ act.balance }} ETH
              </div>
            </button>
          </div>
          <div class="my-[10px] text-[10px] text-center">
            <input
              v-model="termsCheckbox"
              type="checkbox"
              class="mr-[5px] w-[10px] h-[10px]"
            > By connecting my address, I certify that I have read and accept the updated 
            <button
              class="text-primary hover:text-blue_3"
              @click="showTermsOfService = true"
            >
              Terms of Service
            </button>.
          </div> 
        </div>
      </Slide>
    </Carousel>

    <div
      v-if="showTermsOfService"
      class="absolute bg-white w-full h-[100%] top-0 left-0 px-[20px] pt-[15px] pb-[70px] overflow-auto"
    >
      <div class="sticky top-[0] left-0 bg-grey_2 rounded-[8px] text-white text-[12px] py-[10px] flex justify-center items-center gap-[20px] mb-[10px]">
        <button
          class="bg-grey_4 rounded-[8px] px-[15px] py-[7px]"
          @click="termsCheckbox = false, showTermsOfService = false"
        >
          Cancel
        </button>
        <button
          class="bg-primary rounded-[8px] px-[15px] py-[7px]"
          @click="termsCheckbox = true, showTermsOfService = false"
        >
          Agree
        </button>
      </div>
      <TermsOfService />
    </div>
  </div>
</template>

<style scoped>
</style>