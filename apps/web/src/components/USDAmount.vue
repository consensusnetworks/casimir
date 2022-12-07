<script lang="ts" setup>
import { defineProps, onMounted, ref, toRef, watch } from 'vue'
import useFormat from '@/composables/format'
import usePrice from '@/composables/price'

const { formatDecimalString } = useFormat()
const { getExchangeRate } = usePrice()

const usdAmount = ref(0)
const props = defineProps({
    etherAmount: {
        type: String,
        required: true,
    }
})
const etherAmount = toRef(props, 'etherAmount')
onMounted(async () => {
    usdAmount.value = await getExchangeRate(props.etherAmount)
})
watch(etherAmount, async () => {
    usdAmount.value = await getExchangeRate(props.etherAmount)
})

</script>

<template>
  <div>${{ formatDecimalString(usdAmount.toString()) }}</div>
</template>