<script lang="ts" setup>
import { watch } from "vue"
import { RouterView } from "vue-router"
import DefaultLayout from "@/layouts/default-layout.vue"
import useBreakdownMetrics from "@/composables/breakdownMetrics"
import useContracts from "@/composables/contracts"
import useUser from "@/composables/user"

const { initializeContractsComposable } = useContracts()
const { initializeBreakdownMetricsComposable } = useBreakdownMetrics()
const { initializeUserComposable, user } = useUser()

watch(user, async (newUser, oldUser) => {
    // On Sign in
    if (newUser && !oldUser) {
        await initializeContractsComposable()
        await initializeBreakdownMetricsComposable()
    } else if (newUser && oldUser) {
    // On page refresh when signed in}
        await initializeContractsComposable()
        await initializeBreakdownMetricsComposable()
    }
})

</script>
  
<template>
  <Suspense>
    <component :is="DefaultLayout">
      <RouterView />
    </component>
  </Suspense>
</template>
