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
    PlusCircleIcon,
    ArrowRightOnRectangleIcon,
    Square3Stack3DIcon,
    Square2StackIcon,
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
import { 
    Menu, 
    MenuButton, 
    MenuItems, 
    MenuItem,
} from "@headlessui/vue"
import useConnectWalletModal from "@/composables/state/connectWalletModal"

const { toggleConnectWalletModal } = useConnectWalletModal()

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

const user = ref(null)
const userMenu = ref(false)

const showCopyForPrimary = ref(false)
const showCopyForSecondary = ref(-1)
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
        <!-- TODO: On click of this it should check if it should take the user to welcome or overview page -->
        <router-link
          to="/"
          class="h-[16px] w-[19.56px]"
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

        <!-- TODO: Make into a router link to pro app-->
        <button class="pill_primary pill_primary_button">
          <small>Pro</small>
          <ArrowTopRightOnSquareIcon class="pill_primary_icon" />
        </button>
      </div>

      <!-- TODO: Make these route to actual pages and check if they are active -->
      <div class="flex items-center gap-[24px] w-full justify-center 700s:sr-only">
        <router-link
          to="/overview"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['overview']) }"
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

      <div class="flex items-center gap-[24px]">
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
        <div class="w-[200px]">
          <Menu
            as="div"
            class="relative inline-block text-left w-full"
          >
            <div class="">
              <MenuButton
                class="connect_wallet_menu_btn"
                @click="userMenu = true"
              >
                <div
                  v-show="user"
                  class="flex items-center justify-between w-full"
                >
                  <!-- TODO: Make this connect to the primary address of the user -->
                  <div class="flex items-center gap-[8px]">
                    <div class="placeholder_avatar" />
                    <small class="mt-[2px]">address</small>
                  </div>

                  <div>
                    <img
                      :src="isDark? '/expand_icon_light.svg':'/expand_icon_dark.svg'"
                      alt="Expand Icon"
                      class="w-[6.25px] h-[10.13px]"
                    >
                  </div>
                </div>
                <div
                  v-show="!user"
                  class="flex items-center justify-between w-full"
                >
                  <div class="flex items-center gap-[8px]">
                    <div class="placeholder_avatar" />
                    <small class="mt-[2px]">Connect Wallet</small>
                  </div>

                  <div>
                    <img
                      :src="isDark? '/expand_icon_light.svg':'/expand_icon_dark.svg'"
                      alt="Expand Icon"
                      class="w-[6.25px] h-[10.13px]"
                    >
                  </div>
                </div> 
              </MenuButton>
            </div>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <MenuItems
                v-show="userMenu"
                class="absolute right-0 mt-2 origin-top-right shadow-lg dark:shadow-sm dark:shadow-white/30
                ring-1 ring-black/5 focus:outline-none w-full card"
              >
                <!-- TODO: Connect this to open connect wallet modal-->
                <button
                  v-if="!user"
                  class="h-[40px] px-[8px] flex items-center gap-[8px] w-full
                   text-gray_6 dark:text-gray_4 hover:bg-light  
                   hover:bg-gray_4/60 dark:hover:bg-gray_5/60"
                  @click="toggleConnectWalletModal(true), userMenu = false"
                >
                  <PlusCircleIcon class="w-[20px] h-[20px]" />
                  <small>Connect Wallet</small>
                </button>

                <!-- TODO: Connect this to open connect wallet modal, sign out, and copy addresses-->
                <div v-else>
                  <button
                    class="h-[40px] px-[8px] flex items-center gap-[8px] w-full
                   text-gray_6 dark:text-gray_4 hover:bg-light 
                  hover:bg-gray_4/60 dark:hover:bg-gray_5/60 border-b 
                  border-b-lightBorder dark:border-b-lightBorder/60"
                    @click="toggleConnectWalletModal(true), userMenu = false"
                  >
                    <PlusCircleIcon class="w-[20px] h-[20px]" />
                    <small>Add Wallet</small>
                  </button>
                  <!-- TODO: Make these condidtional on if the user has secondary accoutns -->
                  <div class="p-[8px] ">
                    <caption class="text-gray_1 whitespace-nowrap font-[600]">
                      Primary Wallet
                    </caption>

                    <!-- TODO: Make a copy method -->
                    <button
                      class="w-full mt-[8px] rounded-[3px] flex items-center
                      justify-between px-[8px] py-[6px] hover:bg-gray_4 dark:hover:bg-gray_5"
                      @mouseover="showCopyForPrimary = true"
                      @mouseleave="showCopyForPrimary = false"
                    >
                      <div class="flex items-center gap-[8px]">
                        O

                        <p>Address</p>
                      </div>

                      <Square2StackIcon
                        v-show="showCopyForPrimary"
                        class="w-[18px] h-[18px]"
                      />
                    </button>
                  </div>
                  <div class="p-[8px] ">
                    <caption class="text-gray_1 whitespace-nowrap font-[600]">
                      Secondary Wallet(s)
                    </caption>
                    <!-- TODO: v-for here, make sure the @mosueover items show the correct item based on idex -->
                    <button
                      class="w-full mt-[8px] rounded-[3px] flex items-center
                      justify-between px-[8px] py-[6px] hover:bg-gray_4 dark:hover:bg-gray_5"
                      @mouseover="showCopyForSecondary = 1"
                      @mouseleave="showCopyForSecondary = -1"
                    >
                      <div class="flex items-center gap-[8px]">
                        O

                        <p>Address</p>
                      </div>

                      
                      <Square2StackIcon
                        v-show="showCopyForSecondary === 1"
                        class="w-[18px] h-[18px]"
                      />
                    </button>
                  </div>
                  <button
                    class="h-[40px] px-[8px] flex items-center gap-[8px] w-full
                   text-red dark:text-red hover:bg-light  
                   hover:bg-gray_4/60 dark:hover:bg-gray_5/60  border-t 
                  border-t-lightBorder dark:border-t-lightBorder/60"
                  >
                    <ArrowRightOnRectangleIcon class="w-[20px] h-[20px]" />
                    <small>Disconnect Account</small>
                  </button>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>

    <!-- NavBar Menu when screen below 700px -->
    <transition name="slide">
      <div
        v-if="navMenuStatus"
        class="nav_menu_container z-[999]"
        @click="handleOuterClick"
      >
        <div class="nav_menu_inner">
          <div class="w-full">
            <div class="flex items-center justify-between w-full mb-[24px] mt-[5px] px-[12px]">
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
            <div class="flex flex-col items-start gap-[12px] pt-[20px]">
              <router-link
                to="/overview"
                class="nav_menu_links"
                :class="{ 'nav_menu_links_active': matchRoutes(['overview']) }"
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
                <Square3Stack3DIcon class="nav_menu_links_icons" />
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


            <div class="px-[12px] w-full mt-[30px]">
              <button class="pill_primary pill_primary_button w-full">
                <small>Pro</small>
                <ArrowTopRightOnSquareIcon class="pill_primary_icon" />
              </button>
            </div>
          </div>

          <div class="w-full px-[12px]">
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
    </transition>
    <!-- Background blur -->
    <div
      v-if="navMenuStatus"
      class="absolute top-0 left-0 w-screen h-screen 
  bg-white/70 dark:bg-black/70 backdrop-blur-[1px] z-[10]"
    />
  </div>
</template>

<style scoped>
.slide-enter, .slide-enter-active {
  animation: slide_in 0.3s ease-in;
}

@keyframes slide_in {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

.slide-leave, .slide-leave-to {
  animation: slide_out 0.2s ease-in;
}
@keyframes slide_out {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
