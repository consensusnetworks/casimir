<script lang="ts" setup>
</script>

<template>
  <div>
    <div class="px-[60px] h-[54px] pt-[21px] flex justify-between items-start bg-black border-b border-b-[#2C2C2E]">
      <img
        src="/casimir.svg"
        alt="Casimir Logo"
        class="w-[21px]"
      >

      <div class="flex items-start gap-50 h-full">
        <router-link
          to="/"
          class="nav_items_active"
        >
          Overview
        </router-link>
        <router-link
          to="/"
          class="nav_items"
        >
          Staking
        </router-link>
        <router-link
          to="/"
          class="nav_items"
        >
          Exports
        </router-link>
        <router-link
          to="/"
          class="nav_items"
        >
          Resources
        </router-link>
      </div>

      <div class="flex items-center justify-between gap-[64px] text-white">
        <div class="flex items-start justify-between gap-[24px]">
          <i
            data-feather="bell"
            class="h-[18px]"
          />
          <i
            data-feather="book-open" 
            class="h-[18px]"
          />
        </div>

        <button class="account_dropdown flex justify-between items-center gap-[8px] px-[10px] py-[4px]">
          Primary

          <i
            data-feather="chevron-down" 
            class="h-[12px]"
          />
        </button>
      </div>
    </div>

    <div class="relative text-black">
      <slot style="z-index: 1;" />
      <div
        class="bg-black h-[207px] w-full absolute top-0 left-0"
        style="z-index: -1;"
      />

      <div class="bg-black w-full h-[67px] mt-[160px]" />
    </div>
  </div>
</template>

<style scoped>
.nav_items{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 13px;
  line-height: 17px;
  letter-spacing: -0.01em;
  height: 100%;

  color: #ABABAB;
}

.nav_items:hover{
  color: #FFFFFF;
  border-bottom: 1px solid #9BA4B5;
}

.nav_items_active{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 13px;
  line-height: 17px;
  letter-spacing: -0.01em;
  height: 100%;

  color: #FFFFFF;
  border-bottom: 1px solid #9BA4B5;
}

.account_dropdown{
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  border-radius: 8px; 
  color: #344054;
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
}

</style>