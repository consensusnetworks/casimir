<script setup>
import ConnectWallet from "./components/ConnectedWallets.vue"
</script>

<template>
  <div>
    <div class="flex items-start gap-[24px] h-[510px] 700s:flex-wrap-reverse 700s:h-[1044px]">
      <div class="w-9/12 h-full 700s:w-full 700s:h-[510px]">
        <ConnectWallet />
      </div>
      <div class="w-3/12 h-full border 700s:w-full 700s:h-[510px]">
        staking component
      </div>
    </div>
    <div class="w-full mt-[24px] border h-[540px]">
      active stakes
    </div>
  </div>
</template>

<style>
</style>