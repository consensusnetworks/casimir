<script lang="ts" setup>
import TopNav from '@/components/navigation/TopNav.vue'

</script>

<template>
  <div>
    <div class="sr-only noscreen:not-sr-only">
      <div class="h-[100vh] flex flex-col ">
        <div class="">
          <TopNav />
        </div>
        <div
          class="h-full w-full flex justify-center items-center"
        >
          <div
            class="max-w-[1280px] min-w-[360px] h-full 
          w-full overflow-auto px-25 py-margins"
          >
            <slot />
          </div>
        </div>
      </div>
    </div>
    

    <!-- bellow is the view for when the screen width gets below 360px -->
    <div
      class="not-sr-only noscreen:sr-only h-screen
       w-full flex flex-col justify-center items-center"
    >
      <!-- Maybe add animation here -->
      <i
        class="iconoir-enlarge-round-arrow text-[36px]"
      />
      <h6 class="text-grey_2">
        Rotate screen to view app
      </h6>
    </div>
  </div>
</template>