<script lang="ts" setup>

import useUsers from '@/composables/users'
const { user } = useUsers()

</script>
  
<template>
  <div class="flex justify-center items-center">
    <router-link 
      :to="user? '/stake/eth':''"
      class="flex gap-15 items-center pb-20 staking_nav_item"
    >
      <img
        src="/ETH.svg"
        alt="Ethereum svg"
        class="h-25 w-25"
      >
      <h6 class="font-bold">
        Ethereum
      </h6>
      <div class="staking_nav_item_bar" />
    </router-link>
  </div>
</template>