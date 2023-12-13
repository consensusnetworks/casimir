<script setup>
import { 
    ArrowTopRightOnSquareIcon,
    SunIcon,
    MoonIcon,
    Bars3Icon,
    InformationCircleIcon, 
    XMarkIcon,
    ChartBarSquareIcon,
    Cog8ToothIcon,
    MagnifyingGlassCircleIcon,
} from "@heroicons/vue/24/outline"
import router from "@/composables/services/router"
import { 
    useDark,
    useToggle,
    useStorage
} from "@vueuse/core"
import { 
    ref
} from "vue"
import useNavMenu from "@/composables/state/navMenu"

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

const {
    navMenuStatus,
    toggleNavMenu
} = useNavMenu()

const handleOuterClick = (event) =>{
    const navMenuInner = document.querySelector(".nav_menu_inner")
    if (
        navMenuInner && 
        !navMenuInner.contains(event.target)
    ) {
        toggleNavMenu(false)
    }
}

</script>

<template>
  <div class="nav_bar_container">
    <div class="nav_bar_container_inner">
      <button
        class="nav_menu_bar"
        @click="toggleNavMenu(true)"
      >
        <Bars3Icon class="w-[28px] h-[32px]" />
      </button>
      <div
        class="flex items-center gap-[24px] 700s:sr-only"
      >
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
      <div class="flex items-center gap-[12px] 700s:sr-only">
        <router-link
          to="/"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['']) }"
        >
          Overview
        </router-link>
        <router-link
          to="/stake"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['stake']) }"
        >
          Stake
        </router-link>
        <router-link
          to="/explore"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['explore']) }"
        >
          Explore
        </router-link>
        <router-link
          to="/settings"
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

    <!-- NavBar Menu when screen below 700px -->
    <div
      v-show="navMenuStatus"
      class="nav_menu_container"
      @click="handleOuterClick"
    >
      <div class="nav_menu_inner">
        <div class="w-full">
          <div class="flex items-center justify-between w-full mb-[24px] mt-[5px]">
            <router-link
              to="/"
              @click="toggleNavMenu(false)"
            >
              <img
                v-if="isDark"
                src="/casimir.svg"
                alt="Casimir Logo"
                class="h-[16px] w-[19.56px];"
              >
              <img
                v-else
                src="/casimir-dark.svg"
                alt="Casimir Logo"
                class="h-[16px] w-[19.56px];"
              >
            </router-link>

            <button
              class="nav_menu_bar"
              @click="toggleNavMenu(false)"
            >
              <XMarkIcon class="w-[20px] h-[20px]" />
            </button>
          </div>

          <!-- TODO: Make these route to actual pages and check if they are active -->
          <div class="flex flex-col items-start gap-[24px] pt-[30px]">
            <router-link
              to="/"
              class="nav_menu_links"
              :class="{ 'nav_menu_links_active': matchRoutes(['']) }"
              @click="toggleNavMenu(false)"
            >
              <ChartBarSquareIcon class="nav_menu_links_icons" />
              Overview
            </router-link>
            <router-link
              to="/stake"
              class="nav_menu_links"
              :class="{ 'nav_menu_links_active': matchRoutes(['stake']) }"
              @click="toggleNavMenu(false)"
            >
              <img
                v-show="!isDark"
                src="/stake_dark.svg"
                alt="Stake Icon"
                class="nav_menu_links_icons"
              >
              <img
                v-show="isDark"
                src="/stake_light.svg"
                alt="Stake Icon"
                class="nav_menu_links_icons"
              >
              Stake
            </router-link>
            <router-link
              to="/explore"
              class="nav_menu_links"
              :class="{ 'nav_menu_links_active': matchRoutes(['explore']) }"
              @click="toggleNavMenu(false)"
            >
              <MagnifyingGlassCircleIcon class="nav_menu_links_icons" />
              Explore
            </router-link>
            <router-link
              to="/settings"
              class="nav_menu_links"
              :class="{ 'nav_menu_links_active': matchRoutes(['settings']) }"
              @click="toggleNavMenu(false)"
            >
              <Cog8ToothIcon class="nav_menu_links_icons" />
              Settings
            </router-link>
          </div>


          <div>
            <button class="pill_primary pill_primary_button mt-[30px] w-full">
              <small>Pro</small>
              <ArrowTopRightOnSquareIcon class="pill_primary_icon" />
            </button>
          </div>
        </div>

        <div class="w-full">
          <div class="mb-[12px]">
            <button
              id="menu_footer_button"
              @click.stop="toggleDark()"
            >
              <SunIcon
                v-if="isDark"
                class="nav_icon"
              />
              <MoonIcon
                v-else
                class="nav_icon"
              />
            </button>
          </div>
          <div>
            <button
              class="flex items-center gap-[12px] whitespace-nowrap
            text-gray_3 dark:text-white;"
            >
              <InformationCircleIcon class="w-[18px] h-[18px]" />
              <small class="font-[500]">Terms of Service</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
