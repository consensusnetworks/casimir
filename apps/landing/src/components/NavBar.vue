<script lang="ts" setup>
import router from '@/composables/router'
import VueFeather from 'vue-feather'
import useScreenDimensions from '@/composables/screenDimensions'

const { screenWidth } = useScreenDimensions()
</script>

<template>
  <div class="flex items-center justify-between gap-[10px] bg-black pt-[17px] pb-[19px]">
    <img
      src="/casimir.svg"
      alt="Casimir Logo"
      class="w-[21px] "
    >

    <router-link
      to="/"
      class="nav_items"
      :class="router.currentRoute.value.fullPath === '/'? 'nav_items_active' : ''"
    >
      Landing
    </router-link>
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
</style>@/composables/screenDimensions