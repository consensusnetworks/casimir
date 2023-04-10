<script lang="ts" setup>
import { ref } from 'vue'

const selectedTab = ref('Staked' as 'Staked' | 'Transactions')

</script>

<template>
  <div class="w-full h-full">
    <div
      class="flex items-center gap-20 mb-20"
      :class="selectedTab === 'Transactions'? 'flex-row-reverse justify-end' : 'justify-start'"
      style="transition: all 4.5s ease;"
    >
      <button
        :class="selectedTab != 'Staked'? 'opacity-50' : 'opacity-100'"
        class="hover:opacity-100"
        @click="selectedTab = 'Staked'"
      >
        <h6 class="font-bold text-[#727476]">
          Staked
        </h6>
      </button>
      <button 
        :class="selectedTab != 'Transactions'? 'opacity-50' : 'opacity-100'"
        class="hover:opacity-100"
        @click="selectedTab = 'Transactions'"
      >
        <h6 class="font-bold text-[#727476]">
          Transactions
        </h6>
      </button>
    </div>

    <div>
      a;lsdjfasd {{ selectedTab }}
    </div>
  </div>
</template>

<style scoped></style>