<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const selectedTab = ref('Staked' as 'Staked' | 'Transactions')

const selectedTableHeader = ref('')
const sortDirection = ref('down')
const stakingTableHeaders = ref([
  {
    title: 'Wallet',
    value: 'wallet',
    tooltipInfo: 'Wallet Tooltip'
  },
  {
    title: 'Origonal Staked',
    value: 'origonal_staked',
    tooltipInfo: 'Origonal ETH Staked '
  },
  {
    title: 'Compounded Rewards',
    value: 'compounded_rewards',
    tooltipInfo: 'Compounded Rewards Over Time'
  },
  {
    title: 'Total',
    value: 'total_staked',
    tooltipInfo: 'Total Staked ( Original + Compounded Rewards)'
  },
  {
    title: 'Date Staked',
    value: 'date',
    tooltipInfo: 'Date Of Stake'
  },
  {
    title: 'APY',
    value: 'apy',
    tooltipInfo: 'Annual Percentage Yield'
  },
  {
    title: 'Operator\'s Pref.',
    value: 'operator_preformance',
    tooltipInfo: 'Operator\'s Preformance'
  },
  {
    title: 'Validator\'s Pref.',
    value: 'validator_preformance',
    tooltipInfo: 'Validator\'s Preformance'
  },
  {
    title: 'Status',
    value: 'status',
    tooltipInfo: 'Status Of Staked Item'
  },
  {
    title: 'Withdraw',
    value: 'withdraw',
    tooltipInfo: 'Withdraw Action'
  }
])

const page_size = ref(8)
const page_number = ref(1)
const max_pages = ref(0)

const data = ref(null as any)
const filteredData = ref()

const filterData = () => {
  filteredData.value = data.value.slice((page_number.value - 1) * page_size.value, page_number.value * page_size.value)
  max_pages.value = data.value.length/page_size.value

  if(page_number.value >= (Math.ceil(max_pages.value) + 1)) page_number.value = 1 
}

const timeElapsed = (date: string) => {
  const now = new Date() as any
  const past = new Date(date) as any

  let elapsed = (now - past)
  const msPerSecond = 1000
  const msPerMinute = msPerSecond * 60
  const msPerHour = msPerMinute * 60
  const msPerDay = msPerHour * 24
  const msPerMonth = msPerDay * 30 
  const msPerYear = msPerDay * 365 

  const years = Math.floor(elapsed / msPerYear)
  elapsed -= years * msPerYear

  const months = Math.floor(elapsed / msPerMonth)
  elapsed -= months * msPerMonth

  const days = Math.floor(elapsed / msPerDay)
  elapsed -= days * msPerDay
  
  return  (years > 0? `${years} years`: '') +  (years > 0 && months > 0? ', ': '') +
          (months > 0? `${months} months`: '') + (months > 0 && days > 0 || years > 0? ', ': '') +
          (days > 0? `${days} days`: '')
}

onMounted(()=>{
  const randomData = []

  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'

  const randomString = () => {
    let result = ''
    for ( var i = 0; i < 20; i++ ) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  for (let i = 0; i < 100; i++) {
    let origonal_staked = Math.floor(Math.random() * 100) +1
    let compounded_rewards = Math.floor(Math.random() * 100)
    randomData.push(
      {
        wallet: {
          address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
          currency: 'ETH',
          balance: '36',
          balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
          roi: 0.25,
          walletProvider: 'MetaMask'
        },
        origonal_staked: origonal_staked,
        compounded_rewards: compounded_rewards,
        total_staked: origonal_staked + compounded_rewards,
        date: new Date(Math.floor(Math.random() * Date.now())).toDateString(),
        apy: '2.3%',
        operator_preformance: Math.random() < 0.5 ? {
          accurcy: 100,
          value: '100%'
        } : {
          accurcy: 90,
          value: '86%'
        },
        validator_preformance: '100%',
        status: Math.random() < 0.5 ? 'In Waiting' : 'Staked',
        withdraw: true
      }
    )
  }

  data.value = randomData

  filterData()

})

watch([page_number, page_size, data, stakingTableHeaders], ()=>{
  filterData()
})


const paginationOptions = ref(['Show All', 6, 8, 10, 12, 14, 16, 18, 20,])
const openPaginationOptions = ref(false)

const selectedTableRow = ref(null as any)

const withdrawAmount = ref(0)
watch(withdrawAmount, () => {
  if(isNaN(withdrawAmount.value)){
    withdrawAmount.value = 0
  }
})
function resizeInput(this: any) {
  console.log(this)
    this.style.width = (this.value.length + 1) + 'ch'
}
watch(selectedTableRow, () => {
  if(selectedTableRow.value) {
    setTimeout(() => {
      var input = document.getElementById('withdraw_amount_input') 
      if(input)
      input.addEventListener('input', resizeInput) 
      resizeInput.call(input) 
    }, 100)
  } else {

    setTimeout(() => {
      var input = document.getElementById('withdraw_amount_input') 
      if(input)
      input.removeEventListener('input', resizeInput) 
    }, 100)
  }
})
</script>

<template>
  <div class="w-full h-full">
    <div
      class="flex items-center gap-20 mb-20 relative w-min
        600s:w-full 600s:justify-between"
    >
      <button
        :class="selectedTab != 'Staked'? 'opacity-50' : 'opacity-100'"
        class="600s:w-[120px] hover:opacity-100 w-[150px] text-left pb-10"
        @click="selectedTab = 'Staked'"
      >
        <h6 class="font-bold text-[#727476]">
          Staked
        </h6>
      </button>
      <!-- <button 
        :class="selectedTab != 'Transactions'? 'opacity-50' : 'opacity-100'"
        class="600s:w-[120px] 600s:text-right hover:opacity-100 w-[150px] text-left pb-10"
        @click="selectedTab = 'Transactions'"
      >
        <h6 class="font-bold text-[#727476]">
          Transactions
        </h6>
      </button> -->

      <div
        style="transition: width .5s ease;"
        class="absolute bottom-0 h-1 bg-grey_2"
        :class="selectedTab==='Staked'? 
          'w-[150px] 600s:w-[120px]' : 
          'w-0'"
      /> <!-- border animation -->
      <div
        style="transition: width .5s ease;"
        class="absolute bottom-0 right-0 h-1 bg-grey_2"
        :class="selectedTab==='Transactions'? 
          'w-[150px] 600s:w-[120px]' : 
          'w-0'"
      /> <!-- border animation -->
    </div>

    <div class="border border-border rounded-[5px] p-10 relative">
      <transition
        id="select_wallet_section"
        name="slide_escape"
      >
        <div
          v-if="selectedTableRow"
          class="page__boot shadow-lg h-[350px] absolute flex flex-col justify-between gap-10
          animate_up bg-[#edeff3] rounded-[5px] w-[350px] px-10 py-15 z-10"
          style="top: calc(50% - 175px); left: calc(50% - 200px)"
        >
          <div class="flex justify-between w-full border-b border-grey_2 pb-10">
            <h6 class="text-grey_5 font-bold">
              Withdraw
            </h6>
            <button
              class="iconoir-cancel text-[20px]"
              @click="selectedTableRow = null"
            />
          </div>


          <div class="flex items-start justify-center">
            <img
              src="/eth.svg"
              alt="ETH Logo"
              class="h-30 w-30"
            >
            <input
              id="withdraw_amount_input"
              v-model="withdrawAmount"
              placeholder="0"
              type="text"
              class="text-[60px] pl-5 text-border font-medium outline-none bg-transparent"
            >
          </div>


          <div>
            <div class="flex justify-between items-center mb-10">
              <button 
                class="text-body font-bold border disabled:opacity-[0.55] rounded-[5px] 
                px-10 py-8 bg-primary text-white hover:bg-blue_8 w-full"
              >
                Withdraw
              </button>
              <button 
                class="text-body font-bold border disabled:opacity-[0.55] rounded-[5px] 
                px-10 py-8 bg-blue_3 text-grey_1 hover:bg-blue_6 w-full"
              >
                Withdraw All ( {{ selectedTableRow.total_staked }} ETH )
              </button>
            </div>
            <div class="text-caption font-bold text-center leading-5 px-5">
              Withdraws will automaically return to origonal stake of orgin wallet address 
              ( <span class="text-grey_4">{{ selectedTableRow.wallet.address }} </span> )
              within 2 to 4 business days. 
            </div>
          </div>
        </div>
      </transition>
      
      <div class="not-sr-only 1000s:sr-only">
        <table
          class="w-full"
        >
          <thead>
            <tr class="border-b border-border">
              <th
                v-for="header in stakingTableHeaders"
                :key="header.title"
                style="transition: all 0.3s ease;"
                class="text-caption font-bold text-left pb-10"
                :class="selectedTableHeader === header.title? 'text-black font-extrabold w-max' : 'text-border w-min'"
              >
                <button
                  class="flex w-min items-center justify-start gap-10 whitespace-nowrap"
                  @click="selectedTableHeader = header.title"
                >
                  <span class="tooltip 1200s:max-w-[50px] 1200s:truncate">
                    {{ header.title }}
                    <span class="tooltip_text">
                      {{ header.tooltipInfo }}
                    </span>
                  </span>

                  <!-- TD: Add sorting method -->
                  <i
                    v-show="selectedTableHeader === header.title"
                    class="text-body"
                    :class="`iconoir-arrow-${sortDirection}`"
                    @click="sortDirection === 'down'? sortDirection = 'up' : sortDirection = 'down'"
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody
            class="w-full"
          >
            <tr
              v-for="(item, i) in filteredData"
              :key="item"
              class="w-full text-body border-b border-grey_2 hover:bg-grey_1"
              :class="i % 2 === 0? 'text-grey_5' : 'text-grey_3'"
              :style="item === selectedTableRow? 'background-color: #F2F2F2;' : ''"
            >
              <td
                v-for="(header) in stakingTableHeaders"
                :key="header.value"
                class="py-15 font-bold"
              >
                <div
                  v-if="header.value === 'wallet'"
                  class="truncate pr-10 max-w-[150px] 1200s:max-w-[100px]"
                >
                  {{ item.wallet.address }}
                </div>

                <div
                  v-else-if="header.value === 'origonal_staked'"
                  class="truncate pr-10"
                >
                  {{ item.origonal_staked }} ETH
                </div>

                <div
                  v-else-if="header.value === 'compounded_rewards'"
                  class="truncate pr-10"
                >
                  {{ item.compounded_rewards }} ETH
                </div>

                <div
                  v-else-if="header.value === 'total_staked'"
                  class="truncate pr-10"
                >
                  {{ item.total_staked }} ETH
                </div>

                <div
                  v-else-if="header.value === 'date'"
                  class="pr-10 whitespace-nowrap flex justify-between gap-10 items-center max-w-[260px]"
                >
                  <div class="font-bold">
                    {{ new Date(item.date).toLocaleDateString() }}
                  </div>
                  <div class="not-sr-only 1400s:sr-only">
                    {{ timeElapsed(item.date) }}
                  </div>
                </div>

                <div
                  v-else-if="header.value === 'operator_preformance'"
                  class="pr-10 flex items-center gap-5"
                >
                  {{ item.operator_preformance.value }} 

                  <h6 
                    v-show="item.operator_preformance.accurcy < 100"
                    class="iconoir-warning-circle text-warning tooltip"
                  >
                    <span class="tooltip_text text-caption w-[205px]">
                      Operator's preformance may not be 100% accurate due to offline operators
                    </span>
                  </h6>
                </div>

                <div
                  v-else-if="header.value === 'status'"
                  class="truncate pr-10"
                  :class="item.status === 'In Waiting'? 'text-warning' : ''"
                >
                  {{ item.status }}
                </div>

                <div
                  v-else-if="header.value === 'withdraw'"
                  class="truncate pr-10"
                >
                  <button 
                    class="bg-primary py-6 px-12 text-white rounded-[5px]
                  hover:bg-blue_7 disabled:opacity-[0.55]"
                    :disabled="selectedTableRow"
                    @click="selectedTableRow = item"
                  >
                    Withdraw
                  </button>
                </div>

                <div
                  v-else 
                  class="pr-20 whitespace-nowrap font-bold truncate max-w-[150px]"
                >
                  {{ item[header.value] }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!data"
          class="text-center w-full text-body font-bold py-20 text-grey_3 border-b border-b-grey_3"
        >
          No Data
        </div>
      </div>

      <!-- Table in small screen sizes below 1000 px -->
      <div class="sr-only 1000s:not-sr-only">
        <div
          v-for="(item, i) in filteredData"
          :key="item"
          class="py-10 border-b border-b-grey_3"
          :class="i % 2 === 0? 'text-grey_5 ': 'text-grey_3 '"
        >
          <div
            v-for="row in stakingTableHeaders"
            :key="row.value"
            class="flex justify-between items-center text-caption pb-10"
          >
            <div class="whitespace-nowrap">
              {{ row.title }}
            </div>
            <div class="w-full text-right truncate">
              <div
                v-if="row.value === 'wallet'"
              >
                {{ item.wallet.address }}
              </div>

              <div
                v-else-if="row.value === 'origonal_staked'"
              >
                {{ item.origonal_staked }} ETH
              </div>

              <div
                v-else-if="row.value === 'compounded_rewards'"
              >
                {{ item.compounded_rewards }} ETH
              </div>

              <div
                v-else-if="row.value === 'total_staked'"
              >
                {{ item.total_staked }} ETH
              </div>

              <div
                v-else-if="row.value === 'date'"
              >
                <div class="font-bold pb-3">
                  {{ new Date(item.date).toLocaleDateString() }}
                </div>
                {{ timeElapsed(item.date) }}
              </div>

              <div
                v-else-if="row.value === 'operator_preformance'"
                class="flex items-center justify-end gap-5"
              >
                {{ item.operator_preformance.value }} 

                <h6 
                  v-show="item.operator_preformance.accurcy < 100"
                  class="iconoir-warning-circle text-warning tooltip"
                >
                  <span class="tooltip_text text-caption w-[205px]">
                    Operator's preformance may not be 100% accurate due to offline operators
                  </span>
                </h6>
              </div>

              <div
                v-else-if="row.value === 'status'"
                :class="item.status === 'In Waiting'? 'text-warning' : ''"
              >
                {{ item.status }}
              </div>

              <div
                v-else-if="row.value === 'withdraw'"
              >
                <button 
                  class="bg-primary py-6 px-12 text-white rounded-[5px]
                  hover:bg-blue_7 disabled:opacity-[0.55]"
                  :disabled="selectedTableRow"
                  @click="selectedTableRow = item"
                >
                  Withdraw
                </button>
              </div>

              <div
                v-else 
              >
                {{ item[row.value] }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full mt-10 flex items-center justify-between gap-20"> 
        <div>
          <button 
            class="flex items-center gap-10 text-body font-bold border disabled:opacity-[0.55]
            rounded-[5px] px-10 py-8 bg-primary text-white hover:bg-blue_8"
            :disabled="selectedTableRow"
          >
            Export <i class="iconoir-download" />
          </button>
        </div>
        <div class="flex gap-20 items-center">
          <div class="flex justify-center items-center gap-10 text-body">
            <button
              class="iconoir-nav-arrow-left hover:text-grey_3 text-grey_6"
              :class="page_number <= 1? 'opacity-25' : 'opacity-100'"
              :disabled="page_number <= 1"
              @click="page_number -= 1"
            />
            <span class="text-body font-bold text-grey_5">
              {{ page_number }}
            </span>
            <button 
              class="iconoir-nav-arrow-right hover:text-grey_3 text-grey_6"
              :class="page_number >= max_pages? 'opacity-25' : 'opacity-100'"
              :disabled="page_number >= max_pages"
              @click="page_number += 1"
            />
          </div>
          <div 
            class="text-grey_3 border border-grey_3
           px-10 py-4 w-[100px] relative hover:border-grey_4"
            :class="openPaginationOptions? 'rounded-b-[5px]':'rounded-[5px]'"
            @mouseenter="openPaginationOptions = true"
            @mouseleave="openPaginationOptions = false"
          >
            <div class="text-body font-bold flex items-center justify-between text-grey_3 w-full">
              <div>
                {{ page_size }} Per Page
              </div>
              <i
                :class="!openPaginationOptions ? 'iconoir-nav-arrow-down text-[10px]' : 'iconoir-nav-arrow-up text-[10px]'"
              />
            </div>
            <div
              v-show="openPaginationOptions"
              class="absolute border text-grey_3 border-border rounded-t-[5px]
            hover:border-grey_4 bg-white expand_height"
              style="
              bottom: calc(100% - 1px);
              right: calc(-1px);
              width: calc(100% + 2px)
            "
            >
              <div 
                class="w-full p-10"
                :class="openPaginationOptions? 'delay_show opacity-[1]' : 'opacity-0'"
              >
                <button
                  v-for="option in paginationOptions"
                  :key="option"
                  class="w-full mb-5 text-body text-grey_3 text-left hover:text-grey_7"
                  @click="option === 'Show All'? 
                    page_size = data.length
                    : page_size = Number(option)
                  "
                >
                  {{ option }} <span v-show="option != 'Show All'"> Per Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>