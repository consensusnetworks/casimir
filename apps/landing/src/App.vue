<script lang="ts" setup>
// Initalize blogs here for least amount of fetch calls
import useBlogs from "@/composables/blogs.ts"

const {
  activeBlog,
  allBlogs,
  loadingBlogs,
} = useBlogs()
</script>

<template>
  <div>
    <router-view />
  </div>
</template>


<style scoped></style>