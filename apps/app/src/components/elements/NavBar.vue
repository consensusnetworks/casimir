<script setup>
import { ArrowTopRightOnSquareIcon, SunIcon, MoonIcon } from "@heroicons/vue/24/outline"
import router from "@/composables/services/router"
import { useDark, useToggle } from "@vueuse/core"


const matchRoutes = (routes) => {
    for (let i = 0; i < routes.length; i++) {
        if (routes[i] === router.currentRoute.value.fullPath.split("/")[1]) {
            return true
        }
    }
    return false
}

const isDark = useDark()
const toggleDark = useToggle(isDark)

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
          :class="{ 'nav_link_active': matchRoutes(['']) }"
        >
          Overview
        </router-link>
        <router-link
          to="/"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['stake']) }"
        >
          Stake
        </router-link>
        <router-link
          to="/"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['explore']) }"
        >
          Explore
        </router-link>
        <router-link
          to="/"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['settings']) }"
        >
          Settings
        </router-link>
      </div>

      <div class="flex items-center gap-[12px]">
        <button @click="toggleDark()">
          <SunIcon
            v-if="isDark"
            class="nav_icon"
          />
          <MoonIcon
            v-else
            class="nav_icon"
          />
        </button>
        <div class="w-[200px] border">
          connect wallet
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
