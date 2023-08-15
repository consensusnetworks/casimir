<script lang="ts" setup>
import router from '@/composables/router'
import VueFeather from 'vue-feather'
import useScreenDimentions from '@/composables/screenDimenstions'

const { screenWidth } = useScreenDimentions()
</script>

<template>
  <div class="flex items-center justify-between gap-[10px] bg-black pt-[17px] pb-[19px]">
    <img
      src="/casimir.svg"
      alt="Casimir Logo"
      class="w-[21px] mr-[100px]"
    >

    <router-link
      to="/"
      class="nav_items"
      :class="router.currentRoute.value.fullPath === '/'? 'nav_items_active' : ''"
    >
      <span 
        v-show="screenWidth >= 400"
      >
        Casimir
      </span> 
      Landing
    </router-link>
    <a
      href="https://app.dev.casimir.co/"
      class="rounded-[3px] bg-white text-black text-[13px] 
      font-[400] px-[20px] py-[6px] flex items-center gap-[5px]"
    >
      Launch App
      <vue-feather
        type="arrow-up-right"
        class="icon h-[14px]"
      />
    </a>
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
  color: #ABABAB;
}
.nav_items_active{
  color: #FFFFFF;
}
</style>