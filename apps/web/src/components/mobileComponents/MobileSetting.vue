<script lang="ts" setup>
import VueFeather from 'vue-feather'
import useWallet from '@/composables/wallet'
import useUser from '@/composables/users'


const  {
  logout,
} = useWallet()

const { user } = useUser()
</script>

<template>
  <div
    class="h-full w-full px-[20px] pb-[70px] pt-[15px]"
  >
    <button class="border-b border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full">
      <vue-feather
        type="user"
        size="36"
        class="icon w-[17px] h-min"
      />
            
      <span>
        Account
      </span>
    </button>
    <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
      <vue-feather
        type="layers"
        size="36"
        class="icon w-[17px] h-min"
      />
      <span>
        Chanelog
      </span>
    </button>
    <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
      <vue-feather
        type="help-circle"
        size="36"
        class="icon w-[17px] h-min"
      />
      <span>
        Support
      </span>
    </button>
    <button class="flex items-center px-[16px] py-[10px] gap-[12px] w-full">
      <vue-feather
        type="code"
        size="36"
        class="icon w-[17px] h-min"
      />
      <span>
        API
      </span>
    </button>
    <button
      class="border-t border-[#EAECF0] flex items-center px-[16px] py-[10px] gap-[12px] w-full"
      :disabled="!user"
      @click="logout"
    >
      <vue-feather
        type="log-out"
        size="36"
        class="icon w-[17px] h-min"
      />
      <span>
        Log out
      </span>
    </button>
  </div>
</template>

<style scoped>
</style>