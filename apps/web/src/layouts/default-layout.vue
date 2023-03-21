<script lang="ts" setup>
import useUsers from '@/composables/users'

const { user } = useUsers()
</script>

<template>
  <div 
    class="min-w-[360px] min-h-[100vh] h-[100vh] 
    w-[100vw] flex justify-center items-start py-45 overflow-y-auto"
  >
    <div class="max-w-[1448px] w-full px-[140px]">
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
        <div class="text-grey_3">
          Connect Wallet
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>