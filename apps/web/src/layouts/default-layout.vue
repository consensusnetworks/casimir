<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'

const { connectWallet, logout, activeWallets } = useWallet()
const { user } = useUsers()

const openWalletConnect = ref(false)

const copyWalletAddress = (text: string) => {
  navigator.clipboard.writeText(text)
}

const walletContainerHeight = ref('0px')

const userPrimaryAccount = ref(null as any)
onMounted(()=>{

  const tab_el = document.getElementById('wallet_providers_container')

  const outputsize = () => {
    if(tab_el){
      walletContainerHeight.value = (tab_el.offsetHeight + 90)  + 'px'
    }
  }

  setTimeout(() => {
    outputsize()
  }, 100)

  
  if(tab_el){
    new ResizeObserver(outputsize).observe(tab_el)   
  }

  if(user.value){
    const account = user.value.accounts.find((item) => {
      return item.address === user?.value?.address
    })
    userPrimaryAccount.value = account
  }
})
</script>

<template>
  <div 
    class="min-w-[360px] min-h-[100vh] h-[100vh] 
    w-[100vw] flex justify-center items-start py-45 overflow-y-auto"
  >
    <div class="max-w-[1448px] h-full w-full px-[140px] 550s:px-50">
      <div
        v-if="user"
        class="flex justify-between items-center w-full pb-[60px]"
      >
        <div class="flex items-center gap-50">
          <div class="w-[25px]">
            <a href="https://www.casimir.co/">
              <img
                src="/casimir.svg"
                alt="Casimir Logo"
                class="w-[25px] "
              >
            </a>
          </div>
          <div class="not-sr-only 700s:sr-only">
            <router-link to="/">
              <h6 class="text-grey_6 font-medium">
                Dashboard
              </h6>
            </router-link>
          </div>
        </div>
        <div 
          class="text-grey_3 border border-border rounded-[5px]
           px-10 py-8 w-[200px] relative hover:border-grey_4"
          @mouseenter="openWalletConnect = true"
          @mouseleave="openWalletConnect = false"
        >
          <div class="text-body font-bold flex items-center justify-between text-grey w-full">
            <div
              v-if="userPrimaryAccount"
              class="flex items-center gap-10"
            >
              <img
                :src="`/${userPrimaryAccount.walletProvider.toLocaleLowerCase()}.svg`"
                alt="MetaMask SVG"
                class="w-[16px]"
              >
              {{ userPrimaryAccount.walletProvider }} 
            </div>
            <div 
              v-else
              class="flex items-center gap-10"
            >
              Connect Wallet
            </div>
            <i
              :class="!openWalletConnect ? 'iconoir-nav-arrow-down text-[16px]' : 'iconoir-nav-arrow-up text-[16px]'"
            />
          </div>
          <div
            v-show="openWalletConnect"
            class="absolute top-[100% - 1px] right-[-1px] w-[200px] border-x border-b text-grey_3 border-border rounded-b-[5px]
            hover:border-grey_4 bg-white expand_height z-[10]"
            :style="`height: 400px;`"
          >
            <div 
              class="w-full h-full flex flex-col justify-between pt-10"
              :class="openWalletConnect? 'delay_show opacity-[1]' : 'opacity-0'"
            >
              <div class="h-full overflow-y-auto w-full border-t border-border flex justify-between gap-10 py-15">
                <div class="w-full flex justify-between gap-15 items-start px-10">
                  <div
                    id="wallet_providers_container"
                    class="flex flex-col justify-around items-center gap-5"
                  >
                    <button
                      v-for="w in activeWallets"
                      :key="w"
                      class="border border-border p-5 hover:border-blue_3 w-[45px]"
                      @click="connectWallet(w)"
                    >
                      <img
                        :src="'/'+w.toLocaleLowerCase()+'.svg'"
                        :alt="activeWallets + ' Logo'"
                        class="w-35 h-35"
                      >
                    </button>
                  </div>
                  <div class="w-full h-full overflow-y-auto overflow-x-hidden">
                    <div
                      v-if="user"
                      class="w-full h-full"
                    >
                      <div
                        v-for="act in user?.accounts"
                        :key="act.address"
                        class="text-caption w-full truncate mb-10 pr-10 pb-2 border-b border-border"
                      >
                        <div class="relative mb-0 w-full">
                          <img
                            :src="'/' + act.walletProvider.toLocaleLowerCase() + '.svg'"
                            :alt="act.walletProvider + ' Logo'"
                            class="w-20"
                          >
                          <div 
                            v-if="act.address === user?.address"
                            class="w-5 h-5 bg-blue_3 rounded-[5px] absolute left-0 top-0"
                          />
                        </div>
                        <div class="text-body font-bold truncate text-grey_2 w-full flex justify-between items-center gap-5">
                          <div class="truncate">
                            {{ act.address }}
                          </div>
                          <div>
                            <button
                              class="iconoir-copy text-grey_5 text-[14px] hover:text-primary"
                              @click="copyWalletAddress(act.address)"
                            />
                          </div>
                        </div>
                      </div>  
                    </div>
                    <div
                      v-else
                      class="w-full h-full flex justify-center items-center"
                    >
                      <span class="text-center font-bold text-body">
                        No Wallets Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
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
  /* from {
    height: 0px;
  }
  to {
    height: 100%;
  } */
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