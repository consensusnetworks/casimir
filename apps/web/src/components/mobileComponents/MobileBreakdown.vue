<script lang="ts" setup>
import LineChartJS from '@/components/charts/LineChartJS.vue'
import { ref, onMounted, watch } from 'vue'
import useContracts from '@/composables/contracts'
import useUsers from '@/composables/users'
import useEthers from '@/composables/ethers'
import { AnalyticsData, ProviderString } from '@casimir/types'

const { currentStaked, listenForContractEvents, refreshBreakdown, stakingRewards, totalWalletBalance } = useContracts()
const { user, getUserAnalytics, userAnalytics } = useUsers()
const { listenForTransactions } = useEthers()


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

const setChartData = () => {
  let labels
  let data: Array<AnalyticsData> = []

  labels = userAnalytics.value.historical.labels
  data = userAnalytics.value.historical.data

  
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

onMounted(async () => {
  if (user.value?.id) {
    await getUserAnalytics()
    setChartData()
    await refreshBreakdown()
    // TODO: Potentially find a better place to initialize these listeners
    // Doing this here because currently we're currently initializing listeners on connectWallet
    // which isn't used if user is already signed in
    listenForContractEvents()
    listenForTransactions()
  } else {
    setChartData()
  }
})

watch(user, async () => {
    if (user.value?.id) {
      await getUserAnalytics()
      setChartData()
    } else {
      setChartData()
    }
})
</script>

<template>
  <div
    class="h-full w-full bg-white overflow-auto relative  pb-[70px]"
  >
    <div class=" px-[20px] pt-[15px]">
      <h6 class="mb-[10px]">
        Breakdown
      </h6>
      <div class="flex flex-wrap justify-around gap-[20px]  mb-[52px]">
        <div class="card_container">
          <h6 class="balance_title mb-[15px]">
            Total Balance Across Connected Wallets
          </h6>
          <div class="flex items-center justify-between gap-[12px]">
            <h5 class="balance_eth">
              {{ totalWalletBalance.eth }}
            </h5>
            <span class="balance_usd">
              {{ totalWalletBalance.usd }}
            </span>
          </div>
        </div>
        <div class="card_container">
          <h6 class="balance_title mb-[15px]">
            Currently Staked
          </h6>
          <div class="flex items-center justify-between  gap-[12px]">
            <h5 class="balance_eth">
              {{ currentStaked.eth }}
            </h5>
            <span class="balance_usd">
              {{ currentStaked.usd }}
            </span>
          </div>
        </div>
        <div class="card_container">
          <h6 class="balance_title mb-[15px]">
            All Time Staking Rewards Earned
          </h6>
          <div class="flex items-center justify-between  gap-[12px]">
            <h5 class="balance_eth">
              {{ stakingRewards.eth }}
            </h5>
            <span class="balance_usd">
              {{ stakingRewards.usd }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <h6 class="mb-[10px] text-center text-[12px] font-[800]">
      ETH Balance
    </h6>
    <div class="flex justify-between items-center gap-[4px] pl-[5px] pr-[30px]">
      <div class="chart_y_label w-[18px]">
        Value (USD)
      </div>
      <div
        :id="'mobile_line_chart_container_cross_provider_chart'" 
        class="w-full h-[240px]"
      >
        <LineChartJS
          :id="'mobile_cross_provider_chart'"
          :legend="false"
          :x-grid-lines="false"
          :y-grid-lines="true"
          :data="chartData"
          :gradient="true"
        />
      </div>
    </div>
    <div class="text-center w-full text-[12px] font-[400]">
      Historical Over Time
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

.balance_usd{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: #7D8398;
}
.balance_eth{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  color: #344054;
}
.balance_title{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
}
.card_container{
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}
</style>