<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const selectedTab = ref('Staked' as 'Staked' | 'Transactions')

const selectedTableHeader = ref('')
const sortDirection = ref('down')
const stakingTableHeaders = ref([
  // {
  //   title: 'ID',
  //   value: 'id'
  // },
  {
    title: 'Wallet',
    value: 'wallet'
  },
  {
    title: 'Amount',
    value: 'amount'
  },
  {
    title: 'Date Staked',
    value: 'date'
  },
  {
    title: 'Staking Pool',
    value: 'pool_id'
  },
  {
    title: 'Validators/Operators',
    value: 'validators'
  },
  {
    title: 'Status',
    value: 'status'
  },
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

  // const hours = Math.floor(elapsed / msPerHour)
  // elapsed -= hours * msPerHour

  // const minutes = Math.floor(elapsed / msPerMinute)
  // elapsed -= minutes * msPerMinute

  // const seconds = Math.floor(elapsed / msPerSecond)
  // ${hours} hours, ${minutes} minutes, ${seconds} seconds
  
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
    randomData.push(
      {
        // id: randomString(), 
        amount: i * Math.floor(Math.random() * 100),
        date: new Date(Math.floor(Math.random() * Date.now())).toDateString(),
        wallet: {
          address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
          currency: 'ETH',
          balance: '1000000000000000000',
          balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
          roi: 0.25,
          walletProvider: 'MetaMask'
        },
        pool_id: randomString(),
        validators: randomString(),
        status: Math.random() < 0.5 ? {
          status: 'In Waiting'
        } : {
          status: 'Staked',
          dateStaked: new Date(Math.floor(Math.random() * Date.now())).toDateString(),
          apy: 2.5,
          autoStake: Math.random() < 0.5 ? {
            restake: false, 
            rewardsAccumulated: '35 ETH'
          } : {
            restake: true,
            ammountRestaked: '25 ETH'
          }
        }
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
          class="page__boot shadow-lg h-[420px] absolute
          animate_up bg-[#edeff3] rounded-[5px] w-[600px] px-10 py-15"
          style="top: calc(50% - 220px); left: calc(50% - 300px)"
        >
          <div class="flex justify-end w-full mb-10">
            <button
              class="iconoir-cancel text-[20px]"
              @click="selectedTableRow = null"
            />
          </div>

          {{ selectedTableRow }}
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
                  {{ header.title }}
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
              v-for="item in filteredData"
              :key="item"
              class="w-full text-grey_5 text-body border-b border-grey_2 cursor-pointer hover:bg-grey_1"
              @click="selectedTableRow = item"
            >
              <td
                v-for="(header) in stakingTableHeaders"
                :key="header.value"
                class="py-5"
              >
                <div
                  v-if="header.value === 'wallet'"
                  class="text-grey_5 font-bold truncate pr-20 max-w-[150px]"
                >
                  {{ item.wallet.address }}
                </div>

                <div
                  v-else-if="header.value === 'amount'"
                  class="pr-20 whitespace-nowrap font-bold"
                >
                  {{ item.amount }} ETH
                </div>

                <div
                  v-else-if="header.value === 'date'"
                  class="pr-20 whitespace-nowrap py-10 flex justify-between gap-10 items-center max-w-[260px]"
                >
                  <div class="font-bold">
                    {{ new Date(item.date).toLocaleDateString() }}
                  </div>
                  <div>
                    {{ timeElapsed(item.date) }}
                  </div>
                </div>

                <div
                  v-else-if="header.value === 'pool_id'"
                  class="pr-20 whitespace-nowrap font-bold truncate max-w-[150px]"
                >
                  {{ item.pool_id }}
                </div>

                <div
                  v-else-if="header.value === 'validators'"
                  class="pr-20 whitespace-nowrap font-bold truncate max-w-[150px]"
                >
                  {{ item.validators }}
                </div>

                <div
                  v-else-if="header.value === 'status'"
                  class="pr-20 whitespace-nowrap font-bold truncate"
                >
                  <div v-if="item.status.status === 'In Waiting'">
                    <!-- TD: Add tooltip to explain the in waiting -->
                    In Waiting 
                  </div>
                  <div
                    v-else
                    class="flex items-center gap-5"
                  >
                    Staked <span class="iconoir-nav-arrow-right" />
                  </div>
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
            class="flex justify-between items-center text-caption pb-5"
          >
            <div class="whitespace-nowrap">
              {{ row.title }}
            </div>
            <div class="w-full text-right truncate">
              {{ item[row.value] }}
            </div>
          </div>
        </div>
      </div>

      <div class="w-full mt-10 flex items-center justify-between gap-20"> 
        <div>
          <button 
            class="flex items-center gap-10 text-body font-bold border 
          rounded-[5px] px-10 py-8 bg-primary text-white hover:bg-blue_8"
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