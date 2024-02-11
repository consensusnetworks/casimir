<script setup>
import ConnectWallet from "./components/ConnectedWallets.vue"
import StakeCard from "./components/StakeCard.vue"
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
    <div class="w-full mt-[24px] border h-[540px]">
      active stakes
    </div>

    <!-- TODO: add tearms and services card and button -->
  </div>
</template>

<style>
</style>