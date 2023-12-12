<script setup>
import { useDark, } from "@vueuse/core"
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline"
import router from "@/composables/services/router"

const isDark = useDark()

const matchRoute = (route) => {
    // router.currentRoute.value.fullPath.split("/")
    return false
}
</script>

<template>
  <div class="nav_bar_container">
    <div class="nav_bar_container_inner">
      <div class="flex items-center gap-[24px]">
        <router-link to="/">
          <img
            v-if="isDark"
            src="/casimir.svg"
            alt="Casimir Logo"
          >
          <img
            v-else
            src="/casimir-dark.svg"
            alt="Casimir Logo"
          >
        </router-link>

        <!-- TODO: Make into a router link to pro app-->
        <button class="pill_primary pill_primary_button">
          <small>Pro</small>
          <ArrowTopRightOnSquareIcon class="pill_primary_icon" />
        </button>
      </div>


      <!-- TODO: Make these route to actual pages and check if they are active -->
      <div class="flex items-center gap-[12px]">
        <router-link
          to="/"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoute('') }"
        >
          Overview
        </router-link>
        <router-link
          to="/"
          class="nav_links"
        >
          Stake
        </router-link>
        <router-link
          to="/"
          class="nav_links"
        >
          Explore
        </router-link>
        <router-link
          to="/"
          class="nav_links"
        >
          Settings
        </router-link>
      </div>

      <div>
        connect wallet
      </div>
    </div>
  </div>
</template>

<style scoped></style>
