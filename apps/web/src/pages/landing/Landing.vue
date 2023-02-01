<script lang="ts" setup>
import { onMounted, watch } from 'vue'

import useUsers from '@/composables/users'
import router from '@/composables/router'

const { user } = useUsers()

onMounted(() => {
  if(user.value.id){
    router.push('/user-dashboard:' + user.value.id)
  }else{
    router.push('/front-page')
  }
  watch(user,()=>{
    if(user.value.id){
      router.push('/user-dashboard:' + user.value.id)
    }else{
      router.push('/front-page')
    }
  })
})
</script>
  
<template>
  <div class="h-full w-full">
    <router-view />
  </div>
</template>
