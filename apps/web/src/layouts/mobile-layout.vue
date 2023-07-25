<script lang="ts" setup>
import VueFeather from 'vue-feather'

// import BreakdownChart from '@/pages/overview/components/BreakdownChart.vue'

</script>

<template>
  <div class="h-[100vh] w-[100vw] min-w-[360px]">
    <div class="flex flex-col h-full w-full">
      <div class="h-full w-full ">
        a;lskdjfak;l
      </div>
      <div class="h-[70px] w-full bg-black text-white flex justify-around items-center">
        <div class="nav_item">
          <vue-feather
            type="settings"
            class="icon w-[16px] h-min"
          />
          <span>Settings</span>
        </div>

        <div class="nav_item">
          <vue-feather
            type="layout"
            class="icon w-[16px] h-min"
          />
          <span>Breakdown</span>
        </div>

        <div class="nav_item">
          <vue-feather
            type="download"
            class="icon w-[16px] h-min"
          />
          <span>Stake</span>
        </div>

        <div class="nav_item">
          <vue-feather
            type="table"
            class="icon w-[16px] h-min"
          />
          <span>Account</span>
        </div>

        <div class="nav_item">
          <vue-feather
            type="credit-card"
            class="icon w-[16px] h-min"
          />
          <span>Wallets</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav_item{
    color: #FFF;
    font-family: IBM Plex Sans;
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    letter-spacing: 0.13px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: center;
    align-items: center;
}
</style>