<script lang="ts" setup>
import LineChartJS from '@/components/charts/LineChartJS.vue'
import { onMounted, ref, watch} from 'vue'
import useContracts from '@/composables/contracts'
import useUsers from '@/composables/users'

import { ProviderString } from '@casimir/types'

const { currentStaked, refreshBreakdown, stakingRewards, totalWalletBalance } = useContracts()
const { user, getUserAnalytics, userAnalytics } = useUsers()

const chardId = ref('cross_provider_chart')
const selectedTimeframe = ref('historical')

const chartData = ref({} as any)

const getAccountColor = (address: string) => {
  const walletProvider = user.value?.accounts.find( item =>  item.address === address)?.walletProvider as ProviderString

  switch (walletProvider){
    case 'MetaMask':
      return '#F6851B'
    case 'CoinbaseWallet':
      return '#3773F5'
    case 'WalletConnect':
      return '#3396FF'
    case 'Trezor':
      return '#00854D'
    case 'Ledger':
      return '#D4A0FF'
    case 'IoPay':
      return '#00D7C7'
  }
    
}

const setChartData = () => {
  let labels
  let data = []
  switch (selectedTimeframe.value) {
    case '1 month':
      labels = userAnalytics.value.oneMonth.labels
      data = userAnalytics.value.oneMonth.data
      break
    case '6 months':
      labels = userAnalytics.value.sixMonth.labels
      data = userAnalytics.value.sixMonth.data
      break
    case '12 months':
      labels = userAnalytics.value.oneYear.labels
      data = userAnalytics.value.oneYear.data
      break
    case 'historical':
      labels = userAnalytics.value.historical.labels
      data = userAnalytics.value.historical.data
      break
    
    default:
      break
  }

  chartData.value = {
    labels : labels,
    datasets : data.map((item: any) => {
      return {
        data : item.walletBalance,
        label : item.walletAddress,
        borderColor : getAccountColor(item.walletAddress),
        fill: item.walletAddress === user.value?.address,
        backgroundColor: item.walletAddress === user.value?.address? getAccountColor(item.walletAddress) : null,
        pointRadius: 0,
        tension: 0.1
      }
    })
  }
}

onMounted(async () => {
  if (user.value?.id) {
    await getUserAnalytics()
    setChartData()
    await refreshBreakdown()
  }
})

watch(user, async () => {
    if (user.value?.id) {
      await getUserAnalytics()
      setChartData()
    }
})

watch(selectedTimeframe, () => {
  setChartData()
})
</script>

<template>
  <div class="card_container px-[32px] pt-[31px] pb-[77px] text-black  whitespace-nowrap">
    <div class="flex flex-wrap justify-between mb-[52px]">
      <div>
        <h6 class="blance_title mb-[15px]">
          Total Balance Across Connected Wallets
        </h6>
        <div class="flex items-center gap-[12px]">
          <h5 class="blance_amount">
            {{ totalWalletBalance.usd }}
          </h5>
          <span class="blance_exchange">
            {{ totalWalletBalance.exchange }}
          </span>
        </div>
      </div>
      <div class="">
        <h6 class="blance_title mb-[15px]">
          Currently Staked
        </h6>
        <div class="flex items-center gap-[12px]">
          <h5 class="blance_amount">
            {{ currentStaked.usd }}
          </h5>
          <span class="blance_exchange">
            {{ currentStaked.exchange }}
          </span>
        </div>
      </div>
      <div>
        <h6 class="blance_title mb-[15px]">
          All Time Staking Rewards Earned
        </h6>
        <div class="flex items-center gap-[12px]">
          <h5 class="blance_amount">
            {{ stakingRewards.usd }}
          </h5>
          <span class="blance_exchange">
            {{ stakingRewards.exchange }}
          </span>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap gap-[20px] justify-between items-start">
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
      <div class="border border-[#D0D5DD] rounded-[8px] overflow-hidden">
        <button
          class="timeframe_button"
          :class="selectedTimeframe === '1 month'? 'bg-[#F3F3F3]' : ''"
          @click="selectedTimeframe = '1 month'"
        >
          1 month
        </button>
        <button
          class="timeframe_button border-x border-x-[#D0D5DD]"
          :class="selectedTimeframe === '6 months'? 'bg-[#F3F3F3]' : ''"
          @click="selectedTimeframe = '6 months'"
        >
          6 months
        </button>
        <button
          class="timeframe_button border-r border-r-[#D0D5DD]"
          :class="selectedTimeframe === '12 months'? 'bg-[#F3F3F3]' : ''"
          @click="selectedTimeframe = '12 months'"
        >
          12 months
        </button>
        <button
          class="timeframe_button"
          :class="selectedTimeframe === 'historical'? 'bg-[#F3F3F3]' : ''"
          @click="selectedTimeframe = 'historical'"
        >
          historical
        </button>
      </div>
    </div>
    <hr class="w-full bg-[#EAECF0] mt-[20px] mb-[24px]">
    <div class="flex justify-between items-center gap-[4px]">
      <div class="chart_y_label w-[18px]">
        Value (USD)
      </div>
      <div
        :id="'line_chart_container_cross_provider_chart'" 
        class="w-full h-[240px]"
      >
        <LineChartJS
          :id="chardId"
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
.blance_exchange{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: #7D8398;
  @media (max-width: 1210px) {
    font-size: 14px;
  };
  @media (max-width: 1100px) {
    font-size: 12px;
  };
}
.blance_amount{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  color: #344054;
  @media (max-width: 1210px) {
    font-size: 24px;
  };
  @media (max-width: 1100px) {
    font-size: 22px;
  };
}
.blance_title{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
  @media (max-width: 1210px) {
    font-size: 12px;
    line-height: 18px;
  };
  @media (max-width: 1100px) {
    font-size: 10px;
    line-height: 16px;
  };
}
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