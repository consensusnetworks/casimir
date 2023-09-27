b<script lang="ts" setup>
import LineChartJS from '@/components/charts/LineChartJS.vue'
import { onMounted, ref, watch} from 'vue'
import useAnalytics from '@/composables/analytics'
import useUser from '@/composables/user'
import useScreenDimensions from '@/composables/screenDimensions'
import { AnalyticsData, ProviderString, UserAnalyticsData, UserWithAccountsAndOperators } from '@casimir/types'
import useBreakdownMetrics from '@/composables/breakdownMetrics'

const {  user } = useUser()
const { currentStaked, stakingRewards, totalWalletBalance, initializeComposable, uninitializeComposable } = useBreakdownMetrics()
const { screenWidth } = useScreenDimensions()

const chardId = ref('cross_provider_chart')
const selectedTimeframe = ref('historical')
const chartData = ref({} as any)

const getAccountColor = (address: string) => {
  const walletProvider = user.value?.accounts.find( item =>  item.address.toLocaleLowerCase() === address.toLocaleLowerCase())?.walletProvider as ProviderString

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
    case 'TrustWallet':
      return '#0B65C6'
    default:
      return'#80ABFF'
  }
    
}

const formatLegendLabel = (address: string) => {
  const account = user.value?.accounts.find(item => item.address.toLocaleLowerCase() === address.toLocaleLowerCase())

  if (address.length <= 4) {
    return address
  }

  var start = address.substring(0, 3)
  var end = address.substring(address.length - 3)
  var middle = '.'.repeat(2)


  return (account? account.walletProvider : 'Unknown') + ' (' + start + middle + end + ')'
}

const setChartData = (userAnalytics: UserAnalyticsData) => {
  let labels
  let data: Array<AnalyticsData> = []
  switch (selectedTimeframe.value) {
    case '1 month':
      labels = userAnalytics.oneMonth.labels
      data = userAnalytics.oneMonth.data as any
      break
    case '6 months':
      labels = userAnalytics.sixMonth.labels
      data = userAnalytics.sixMonth.data as any
      break
    case '12 months':
      labels = userAnalytics.oneYear.labels
      data = userAnalytics.oneYear.data as any
      break
    case 'historical':
      labels = userAnalytics.historical.labels
      data = userAnalytics.historical.data as any
      break
    
    default:
      break
  }

  chartData.value = {
    labels : labels,
    datasets : data.map((item: any) => {
      const primaryAccount = item.walletAddress.toLocaleLowerCase() === user.value?.address.toLocaleLowerCase()
      return {
        data : item.walletBalance,
        label : formatLegendLabel(item.walletAddress),
        borderColor : getAccountColor(item.walletAddress),
        fill: primaryAccount,
        backgroundColor: primaryAccount? getAccountColor(item.walletAddress) : null,
        pointRadius: 0,
        tension: 0.1
      }
    })
  }
}


const {userAnalytics, updateAnalytics, initializeAnalyticsComposable } = useAnalytics()

onMounted(() => {
  if(user.value){
    initializeComposable(user.value as UserWithAccountsAndOperators)
    initializeAnalyticsComposable()
  }else{
    uninitializeComposable()
  }
  setChartData(userAnalytics.value as UserAnalyticsData)
})

watch(selectedTimeframe, () => {
  setChartData(userAnalytics.value as UserAnalyticsData)
})

watch(userAnalytics, () => {
  setChartData(userAnalytics.value as UserAnalyticsData)
})

watch(user, async () => {
  if (user.value) {
    initializeComposable(user.value as UserWithAccountsAndOperators)
  } else {
    uninitializeComposable()
  }
  await updateAnalytics()
  setChartData(userAnalytics.value as UserAnalyticsData)
})

</script>

<template>
  <div class="card_container px-[32px] pt-[31px] pb-[77px] text-black  whitespace-nowrap relative">
    <div class="flex flex-wrap gap-[20px] justify-between mb-[52px]">
      <div :class="screenWidth < 450? 'w-full border-b pb-[10px] flex justify-between items-start gap-[5px]' : ''">
        <h6 class="balance_title mb-[15px] tooltip_container">
          Available Balance

          <div class="tooltip w-[200px]">
            Total value of [ethereum] held in the connected wallet addresses. Does not include staked assets. 
          </div>
        </h6>
        <div class="flex items-end gap-[12px]">
          <h5 class="balance_eth">
            {{ totalWalletBalance.eth }}
          </h5>
          <span class="balance_usd pb-[4px]">

            {{ totalWalletBalance.usd }}
          </span>
        </div>
      </div>
      <div :class="screenWidth < 450? 'w-full border-b pb-[10px] flex justify-between items-start gap-[5px]' : ''">
        <h6 class="balance_title mb-[15px] tooltip_container">
          Currently Staked
          <div class="tooltip w-[200px] right-0">
            Ethereum actively staked through Casimir from connected wallet addresses. Does not include withdrawn stake. 
          </div>
        </h6>
        <div class="flex items-end gap-[12px] ">
          <h5 class="balance_eth">
            {{ currentStaked.eth }}
          </h5>
          <span class="balance_usd  pb-[4px]">
            {{ currentStaked.usd }}
          </span>
        </div>
      </div>
      <div :class="screenWidth < 450? 'w-full border-b pb-[10px] flex justify-between items-start gap-[5px]' : ''">
        <h6 class="balance_title mb-[15px] tooltip_container">
          Rewards Earned
          <div class="tooltip w-[200px] right-0">
            Total rewards earned from ethereum that is currently or has ever been staked through Casimir. Includes withdrawn and restaked earnings. 
          </div>
        </h6>
        <div class="flex items-end gap-[12px]">
          <h5 class="balance_eth">
            {{ stakingRewards.eth }}
          </h5>
          <span class="balance_usd  pb-[4px]">
            {{ stakingRewards.usd }}
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
.balance_usd{
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
.balance_eth{
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
.balance_title{
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
</style>@/composables/user