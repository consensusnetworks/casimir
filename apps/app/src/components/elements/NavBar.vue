<script setup>
import { useDark, } from "@vueuse/core"
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline"
const isDark = useDark()
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

        <!-- TODO: Make into a router link -->
        <button class="pill_primary pill_primary_button">
          <small>Pro</small>
          <ArrowTopRightOnSquareIcon class="pill_primary_icon" />
        </button>
      </div>

      <div>
        nav items
      </div>

      <div>
        connect wallet
      </div>
    </div>
  </div>
</template>

<style scoped></style>
