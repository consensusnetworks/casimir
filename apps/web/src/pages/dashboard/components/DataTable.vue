<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const selectedTab = ref('Staked' as 'Staked' | 'Transactions')

const selectedTableHeader = ref('')
const sortDirection = ref('down')
const tableHeaders = ref([
  {
    title: 'ID',
    value: 'id'
  },
  {
    title: 'Amount',
    value: 'amount'
  },
  {
    title: 'Auto Restake',
    value: 'autoRestake'
  },
  {
    title: 'Date Staked',
    value: 'date'
  },
])

const page_size = ref(16)
const page_number = ref(1)
const max_pages = ref(0)

const data = ref(null as any)
const filteredData = ref()

const filterData = () => {
  filteredData.value = data.value.slice((page_number.value - 1) * page_size.value, page_number.value * page_size.value)
  max_pages.value = data.value.length/page_size.value

  if(page_number.value >= (Math.ceil(max_pages.value) + 1)) page_number.value = 1 
}

onMounted(()=>{
  const randomData = []
  for (let i = 0; i < 100; i++) {
    randomData.push(
      {
        id: i + 'as;dkfjajsdfa', 
        amount: i * Math.floor(Math.random() * 100) + ' $',
        autoRestake: true,
        date: '1/1/' + i
      }
    )
  }

  data.value = randomData

  filterData()
})

watch([page_number, page_size, data, tableHeaders], ()=>{
  filterData()
})

const paginationOptions = ref(['Show All', 6, 8, 10, 12, 14, 16, 18, 20,])
const openPaginationOptions = ref(false)

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
      <button 
        :class="selectedTab != 'Transactions'? 'opacity-50' : 'opacity-100'"
        class="600s:w-[120px] 600s:text-right hover:opacity-100 w-[150px] text-left pb-10"
        @click="selectedTab = 'Transactions'"
      >
        <h6 class="font-bold text-[#727476]">
          Transactions
        </h6>
      </button>

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

    <div class="border border-border rounded-[5px] p-10">
      <div class="not-sr-only 1000s:sr-only">
        <table
          class="w-full"
        >
          <thead>
            <tr class="border-b border-border">
              <th
                v-for="header in tableHeaders"
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
              class="w-full text-grey_5 text-body border-b border-grey_2"
            >
              <td
                v-for="(header) in tableHeaders"
                :key="header.value"
                class="py-5"
              >
                {{ item[header.value] }}
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
      <div class="sr-only 1000s:not-sr-only">
        <div
          v-for="(item, i) in filteredData"
          :key="item"
          class="py-10 border-b border-b-grey_3"
          :class="i % 2 === 0? 'text-grey_5 ': 'text-grey_3 '"
        >
          <div
            v-for="row in tableHeaders"
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
      <div class="w-full mt-10 flex items-center justify-end gap-20"> 
        <div class="flex justify-center items-center gap-10 text-body">
          <button
            class="iconoir-nav-arrow-left hover:text-grey_3 text-grey_6"
            :class="page_number <= 1? 'opacity-25' : 'opacity-100'"
            :disabled="page_number <= 1"
            @click="page_number -= 1"
          />
          <span class="text-caption font-bold text-grey_5">
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
          <div class="text-caption font-bold flex items-center justify-between text-grey_3 w-full">
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
                class="w-full mb-5 text-caption text-grey_3 text-left hover:text-grey_7"
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
</template>

<style scoped>
</style>