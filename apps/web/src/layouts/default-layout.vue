<script lang="ts" setup>
import { ref } from 'vue'
import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'

const { connectWallet, logout, loadingUserWallets } = useWallet()
const { user } = useUsers()

const openWalletConnect = ref(false)
</script>

<template>
  <div 
    class="min-w-[360px] min-h-[100vh] h-[100vh] 
    w-[100vw] flex justify-center items-start py-45 overflow-y-auto"
  >
    <div class="max-w-[1448px] h-full w-full px-[140px]">
      <!-- TD: change !user -> user -->
      <div
        v-if="!user"
        class="flex justify-between items-center gap-45 w-full pb-[60px]"
      >
        <div class="flex items-center gap-50">
          <div>
            <a href="https://www.casimir.co/">
              <img
                src="/casimir.svg"
                alt="Casimir Logo"
                class="w-[30px]"
              >
            </a>
          </div>
          <div>
            <h6 class="text-grey_6 font-medium">
              Dashboard
            </h6>
          </div>
        </div>
        <div 
          class="text-grey_3 border border-border rounded-[5px]
           p-10 w-[200px] relative hover:border-grey_4"
          @mouseenter="openWalletConnect = true"
          @mouseleave="openWalletConnect = false"
        >
          <div class="text-body font-bold flex items-center justify-between text-grey w-full">
            <div
              v-if="!user"
              class="flex items-center gap-10"
            >
              <img
                src="/metamask.svg"
                alt="MetaMask SVG"
                class="w-[16px]"
              >
              MetaMask 
            </div>
            <i
              :class="!openWalletConnect ? 'iconoir-nav-arrow-down text-[16px]' : 'iconoir-nav-arrow-up text-[16px]'"
            />
          </div>
          <div
            v-show="openWalletConnect"
            class="absolute top-[100% - 1px] right-[-1px] w-[200px] border-x border-b text-grey_3 border-border rounded-b-[5px]
            hover:border-grey_4 bg-white expand_height "
          >
            <div 
              class="w-full h-full flex flex-col justify-between "
              :class="openWalletConnect? 'delay_show opacity-[1]' : 'opacity-0'"
            >
              <div class="h-full px-10 pt-10">
                <div class="w-full h-full border-t border-border ">
                  content
                </div>
              </div>
              <button
                class="border-t border-decline w-full flex items-center justify-center 
                gap-10 py-12 font-bold text-body text-decline hover:bg-decline 
                hover:text-white"
                @click="logout"
              >
                Disconnect
                <i class="iconoir-log-out" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.expand_height{
  animation: grow_height 0.25s forwards;
  transition: all 0.05s ease;
  overflow: hidden;
}

@keyframes grow_height {
  from {
    height: 0px;
  }
  to {
    height: 300px;
  }
}

.delay_show{
  opacity: 0;
  animation: opacity_show 0.05s forwards;
  animation-delay: 0.05s;
  transition: all 0.05s ease;
  transition-delay: 0.05s;
}

@keyframes opacity_show {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>