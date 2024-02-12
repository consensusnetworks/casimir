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
import useAuth from "@/composables/services/auth"
import useUser from "@/composables/services/user"
import useFormat from "@/composables/services/format"

const { convertString } = useFormat()

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

const { user } = useUser()
const userMenu = ref(false)
const { logout } = useAuth()

const showCopyForPrimary = ref(false)
const showCopyForSecondary = ref(-1)
const copySuccessful = ref("")
const handleLogout = async() => {
    await logout()
    userMenu.value = false
}

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            copySuccessful.value = "copied"
            setTimeout(() => {
                copySuccessful.value = ""
            }, 1000)
        })
        .catch(err => {
            copySuccessful.value = "failed"
            setTimeout(() => {
                copySuccessful.value = ""
            }, 1000)
        })
}
</script>

<template>
  <div class="nav_bar_container">
    <div class="nav_bar_container_inner">
      <div
        class="flex items-center gap-[24px] w-full"
      >
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
      </div>
      
      <div class="flex items-center gap-[24px] w-full justify-center 500s:sr-only">
        <router-link
          to="/"
          class="nav_links"
          :class="{ 'nav_link_active': matchRoutes(['']) }"
        >
          Casimir Stake
        </router-link>
      </div>

      <div class="flex items-center justify-end gap-[24px] w-full">
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
                  v-if="user"
                  class="flex items-center align-middle justify-between w-full"
                >
                  <div class="flex items-center gap-[8px]">
                    <div class="w-[20px] h-[20px]">
                      <img
                        :src="`/${user.walletProvider.toLowerCase()}.svg`"
                        :alt="`/${user.walletProvider.toLowerCase()}.svg`"
                        class="block w-full h-full max-w-full"
                      >
                    </div>

                    <div class="card_title font-[400] mb-0">
                      {{ convertString(user.address) }}
                    </div>
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
                  <div class="p-[8px] ">
                    <caption class="text-gray_1 whitespace-nowrap font-[600]">
                      Primary Wallet
                    </caption>

                    <button
                      class="w-full mt-[8px] rounded-[3px] flex items-center
                      justify-between px-[8px] py-[6px] hover:bg-gray_4 dark:hover:bg-gray_5"
                      @click="copyTextToClipboard(user.address)"
                      @mouseover="showCopyForPrimary = true"
                      @mouseleave="showCopyForPrimary = false"
                    >
                      <div class="flex items-center gap-[8px]">
                        <div class="w-[20px] h-[20px]">
                          <img
                            :src="`/${user.walletProvider.toLowerCase()}.svg`"
                            :alt="`/${user.walletProvider.toLowerCase()}.svg`"
                            class="block w-full h-full max-w-full"
                          >
                        </div>

                        <div class="card_title font-[400] mb-0 text-gray_5">
                          {{ convertString(user.address) }}
                        </div>
                      </div>

                      <div 
                        v-if="showCopyForPrimary && copySuccessful === ''"
                      >
                        <Square2StackIcon
                          class="w-[18px] h-[18px] text-gray_3"
                        />
                      </div>

                      <div
                        v-else-if="showCopyForPrimary && copySuccessful === 'copied'"
                        class="flex items-center text-[10px] text-green font-[600]"
                      >
                        Copied
                      </div>

                      <div
                        v-else-if="showCopyForPrimary && copySuccessful === 'failed'"
                        class="flex items-center text-[10px] text-red"
                      >
                        Failed
                      </div>
                    </button>
                  </div>
                  <div
                    v-show="user.accounts.length > 1"
                    class="p-[8px]"
                  >
                    <caption class="text-gray_1 whitespace-nowrap font-[600]">
                      Secondary Wallet(s)
                    </caption>
                    <button
                      v-for="(account, index) in user.accounts"
                      :key="index"
                      class="w-full mt-[8px] rounded-[3px] flex items-center
                      justify-between px-[8px] py-[6px] hover:bg-gray_4 dark:hover:bg-gray_5"
                      @click="copyTextToClipboard(account.address)"
                      @mouseover="showCopyForSecondary = index"
                      @mouseleave="showCopyForSecondary = -1"
                    >
                      <div class="flex items-center gap-[8px]">
                        <div class="w-[20px] h-[20px]">
                          <img
                            :src="`/${account.walletProvider.toLowerCase()}.svg`"
                            :alt="`/${account.walletProvider.toLowerCase()}.svg`"
                            class="block w-full h-full max-w-full"
                          >
                        </div>

                        <div class="card_title font-[400] mb-0">
                          {{ convertString(account.address) }}
                        </div>
                      </div>

                      <div 
                        v-if="showCopyForSecondary && index === ''"
                      >
                        <Square2StackIcon
                          class="w-[18px] h-[18px] text-gray_3"
                        />
                      </div>

                      <div
                        v-else-if="showCopyForSecondary && index === 'copied'"
                        class="flex items-center text-[10px] text-green font-[600]"
                      >
                        Copied
                      </div>

                      <div
                        v-else-if="showCopyForSecondary && index === 'failed'"
                        class="flex items-center text-[10px] text-red"
                      >
                        Failed
                      </div>
                    </button>
                  </div>
                  <button
                    class="h-[40px] px-[8px] flex items-center gap-[8px] w-full
                   text-red dark:text-red hover:bg-light  
                   hover:bg-gray_4/60 dark:hover:bg-gray_5/60  border-t 
                  border-t-lightBorder dark:border-t-lightBorder/60"
                    @click="handleLogout"
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
