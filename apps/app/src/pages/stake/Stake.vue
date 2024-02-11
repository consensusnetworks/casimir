<script setup>
import { ref } from "vue"
import ConnectWallet from "./components/ConnectedWallets.vue"
import StakeCard from "./components/StakeCard.vue"
import ActiveStakes from "./components/ActiveStakes.vue"
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
} from "@headlessui/vue"
import { 
    InformationCircleIcon,
} from "@heroicons/vue/24/outline"

import TermsOfService from "@/components/elements/TermsOfService.vue"

const openTermsAndConditions = ref(false)


const closeTermsAndCondiditons = () => {
    openTermsAndConditions.value = false
}
const  openTermsAndCondiditons = () => {
    openTermsAndConditions.value = true
}
</script>

<template>
  <div>
    <div class="flex items-start gap-[24px] h-[510px] 900s:flex-wrap-reverse 900s:h-[1044px]">
      <div class="w-9/12 h-full 900s:w-full 900s:h-[510px]">
        <ConnectWallet />
      </div>
      <div class="w-3/12 h-full 900s:w-full 900s:h-[510px] min-w-[300px]">
        <StakeCard />
      </div>
    </div>
    <div class="w-full mt-[24px] h-[540px]">
      <ActiveStakes />
    </div>

    <div class="py-[24px] flex items-center justify-end">
      <button
        class="flex items-center gap-[8px] hover:opacity-80 active:opacity-60"
        @click="openTermsAndCondiditons"
      >
        <InformationCircleIcon class="w-[16px] h-[16px]" />
        <caption class="whitespace-nowrap font-[500] tracking-[0.2px]">
          Terms and Conditions
        </caption>
      </button>
    </div>

    <!-- TODO: add tearms and services card and button -->

    <!-- Active Stake Options -->
    <TransitionRoot
      appear
      :show="openTermsAndConditions"
      as="template"
    >
      <Dialog
        as="div"
        class="relative z-10"
        @close="closeTermsAndCondiditons"
      >
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div
            class="flex min-h-full items-center justify-center p-4 text-center"
          >
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                v-show="selectedStake !== null"
                class="card w-full max-w-[360px] px-[24px] pb-[24px] max-h-[500px] overflow-auto relative"
              >
                <div class="pt-[24px] text-left pb-[24px] border-b border-b-lightBorder dark:border-b-darkBorder sticky top-0 left-0 bg-[#FFF] dark:bg-black">
                  <h1 class="card_title">
                    Terms and Conditions
                  </h1>
                  <p class="card_subtitle">
                    Copyright Consensus Networks, Inc. 2023
                    17 U.S.C. §§ 101-810
                  </p>
                </div>

                <TermsOfService />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<style>
</style>