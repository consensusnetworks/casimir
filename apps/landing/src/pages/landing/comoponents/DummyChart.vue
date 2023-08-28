
<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import LineChartJS from '@/components/charts/LineChartJS.vue'
import useTxData from '@/mockData/mock_transaction_data.ts'

const { txData, mockData} = useTxData()

const chartData = ref({} as any)

const setupMockData =() =>{
    const sortedTransactions = txData.value.sort((a: any, b: any) => {
        new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    })


        let labels = [] as any
        let data = [] as any

        let earliest: any = null
        const latest: any = new Date().getTime()
        sortedTransactions.forEach((tx: any) => {
            const receivedAt = new Date(tx.receivedAt)
            if (!earliest) earliest = receivedAt.getTime()
            if (receivedAt.getTime() < earliest) earliest = receivedAt.getTime()
        })
        const historicalInterval = (latest - earliest) / 11

    sortedTransactions.forEach((tx: any) => {
        const { receivedAt, walletAddress, walletBalance } = tx
        let historicalDataIndex = data.findIndex((obj: any) => obj.walletAddress === walletAddress)
        if (historicalDataIndex === -1) {
            const dataLength = data.push({ walletAddress, walletBalance: Array(12).fill(0) })
            historicalDataIndex = dataLength - 1
        }
        const intervalIndex = Math.floor((new Date(receivedAt).getTime() - earliest) / historicalInterval)
        data[historicalDataIndex].walletBalance[intervalIndex] = walletBalance


        let previousMonth: any = null
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        labels = Array(12).fill(0).map((_, i) => {
            const date = new Date(earliest + (historicalInterval * i))
            const currentMonth = date.getMonth()
            if (!previousMonth) {
                previousMonth = currentMonth
                return date.getMonth() === 0 ? `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}` : `${months[date.getMonth()]} ${date.getDate()}`
            } else if (currentMonth < previousMonth) {
                previousMonth = currentMonth
                return `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}`
            } else {
                previousMonth = currentMonth
                return `${months[date.getMonth()]} ${date.getDate()}`
            }
        })

 
    })
    data[0].walletAddress = '0xd5****A212'
    data[0].walletBalance[11] = Math.floor(Math.random() * 100).toString()

    chartData.value = {
        labels : labels,
        datasets : data.map((item: any) => {
            return {
                data : item.walletBalance,
                label : 'MetaMask 0xd5****A212',
                borderColor : '#F6851B',
                borderWidth: 1,
                fill: true,
                backgroundColor: '#F6851B',
                pointRadius: 0,
                tension: 0.1
            }
        })
    }
}

watch(txData, ()=>{
    setupMockData()
})

onMounted(() =>{
    mockData(400, '0xd5****A212')
    // setupMockData()
})
</script>

<template>
  <div class="px-[32px] pt-[31px] pb-[77px] text-black  whitespace-nowrap flex items-center justify-center flex-wrap">
    <div class="flex flex-wrap gap-[20px] justify-between items-start w-full">
      <div>
        <h6 class="card_title">
          Ethereum Balance
        </h6>
        <div class="flex flex-wrap items-center gap-[22px]">
          <div
            v-for="item in chartData.datasets"
            :key="item"
            class="flex gap-[10px] items-center"
          >
            <div
              class="w-[9px] h-[9px] rounded-[999px]"
              :style="`background: ${item.borderColor};`"
            />
            <span class="legent_label">
              {{ item.label }} 
            </span>
          </div>
        </div>
      </div>
      <div class="border border-[#D0D5DD] rounded-[8px] overflow-hidden flex">
        <div
          class="timeframe_button"
        >
          1 month
        </div>
        <div
          class="timeframe_button border-x border-x-[#D0D5DD]"
        >
          6 months
        </div>
        <div
          class="timeframe_button border-r border-r-[#D0D5DD]"
        >
          12 months
        </div>
        <div
          class="timeframe_button bg-[#F3F3F3]"
        >
          historical
        </div>
      </div>
    </div>
    <hr class="w-full bg-[#EAECF0] mt-[20px] mb-[24px]">
    <div class="flex justify-between items-center gap-[4px] w-full">
      <div class="chart_y_label w-[18px]">
        Value (USD)
      </div>
      <div
        :id="'line_chart_container_cross_provider_chart'" 
        class="w-full h-[340px]"
      >
        <LineChartJS
          :id="'dummy_chart'"
          :legend="false"
          :x-grid-lines="false"
          :y-grid-lines="true"
          :data="chartData"
          :gradient="true"
        />
      </div>
    </div>
  </div>
</template>


<style scoped>

.chart_y_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #667085;
    transform: rotate(-90deg);
    white-space: nowrap;
}
.timeframe_button{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 10px;
    line-height: 20px;
    color: #344054;
    padding: 5px 10px;
}
.legent_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 11px;
    line-height: 20px;
    color: #8B8B8B;
}
.card_container{
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}

.card_title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    color: #101828;
    @media (max-width: 1200px) {
      font-size: 14px;
    };
}
</style>