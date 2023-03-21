<script lang="ts" setup>
// 
</script>

<template>
  <div class="grid grid-cols-8  gap-[24px] h-full w-full">
    <div class="col-span-4 border h-[450px]">
      <div>
        <h6 class="font-bold text-[#727476]">
          Analytics
        </h6>
      </div>

      <router-link to="/auth">
        auth
      </router-link>
    </div> <div class="col-span-1 h-[450px]" />
    <div class="col-span-3 border h-[450px]">
      <div>
        <h6 class="font-bold text-[#727476]">
          Stake
        </h6>
      </div>
    </div>
    <div class="col-span-8 h-[300px] pb-45">
      <div class="w-full h-full border">
        <h6 class="font-bold text-[#727476]">
          Table
        </h6>
      </div>
    </div>
  </div>
</template>