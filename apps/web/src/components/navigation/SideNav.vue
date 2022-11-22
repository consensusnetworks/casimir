<script lang="ts" setup>
import { ref, watch } from 'vue'
import router from '@/composables/router'

const open = ref(false)



const selectedPage = ref(router.currentRoute.value.fullPath)

watch (router.currentRoute, () => {
  selectedPage.value = router.currentRoute.value.fullPath
})

// To Do: connect this to our Auth and see if an account exsists
const account = ref(true)

</script>
  
<template>
  <div 
    class="side-nav-container"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <!-- To Do: make these images link from the web to landing -->
    <div class="pl-gutter">
      <RouterLink 
        to="/"
      >
        <img
          src="/casimir.svg"
          alt="Casimir Logo"
          class="nav-imgs"
        >
      </RouterLink>
    </div>

    <RouterLink 
      to="/"
    >
      <div
        class="side-nav-tabs"
        :class="selectedPage === '/'? 'side-nav-tabs-selected' : 'text-white'"
      >
        <i
          class="iconoir-report-columns"
        />
        <span
          v-show="open"
          class="slowExpandText"
        > Dashboard </span>
      </div>
    </RouterLink>

    <RouterLink 
      :to="!account ? '' : '/Staking'"
    >
      <div
        class="side-nav-tabs"
        :class="selectedPage === '/Staking'? 'side-nav-tabs-selected' : ''"
        :style="!account? {
          'cursor' : 'default'
        } : {}"
      >
        <div :class="!account? 'flex text-grey_5': 'flex text-white'">
          <i>
            <img
              src="Staking-Icon.svg"
              alt="Staking Icon"
              :class="!account? 'opacity-50': 'opacity-100'"
            >
          </i> 
          <span
            v-show="open"
            class="slowExpandText"
          > Staking </span>
        </div>
      </div>
    </RouterLink>

    <RouterLink 
      :to="!account ? '' : '/Assets'"
      class="disabled"
    >
      <div
        class="side-nav-tabs"
        :class="selectedPage === '/Assets'? 'side-nav-tabs-selected' : ''"
        :style="!account? {
          'cursor' : 'default',
        } : {}"
      >
        <div :class="!account? 'flex text-grey_5': 'flex text-white cursor-default'">
          <i
            class="iconoir-database-star"
          />
          <span
            v-show="open"
            class="slowExpandText"
          > Assets </span>
        </div>
      </div>
    </RouterLink>

    <div class="px-gutter">
      <hr>
    </div>
  </div>
</template>

<style scoped>
</style>
