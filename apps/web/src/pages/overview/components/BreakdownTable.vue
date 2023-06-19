<script lang="ts" setup>
import LineChartJS from '@/components/charts/LineChartJS.vue'
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import VueFeather from 'vue-feather'

const searchInput = ref('')
const tableView = ref('Wallets')

const selectedHeader = ref('')
const selectedOrientation = ref('ascending')

const tableHeaderOptions = ref(
  {
    Wallets: {
      headers: [
        {
          title: 'Wallet Provider',
          value: 'wallet_provider'
        },
        {
          title: 'Account',
          value: 'act'
        },
        {
          title: 'Balance',
          value: 'bal'
        },
        {
          title: 'Staked Amount',
          value: 'stk_amt'
        },
        {
          title: 'Staked Reward',
          value: 'stk_rwd'
        }
      ]
    },
    Transactions: {
      headers: [
        {
          title: 'TX Hash',
          value: 'tx_hash'
        },
        {
          title: 'Staked Amount',
          value: 'stk_amt'
        },
        {
          title: 'Staked Reward',
          value: 'stk_rwd'
        },
        {
          title: 'Date',
          value: 'date'
        },
        {
          title: 'APY',
          value: 'apy'
        },
        {
          title: 'Status',
          value: 'status'
        },
        {
          title: 'Operators',
          value: 'operators'
        }
      ]
    },
  }
)

const tableMockedItems = ref({
  Wallets: [
    {
      wallet_provider: 'MetaMask',
      act: '12345678910asdfghjkl;qwertyuiopzxcvbnm',
      bal: '1.5 ETH',
      stk_amt: '0.5 ETH',
      stk_rwd: '0.034 ETH'
    },
    {
      wallet_provider: 'CoinbaseWallet',
      act: '12345678910asdfghjkl;qwertyuiopzxcvbnm',
      bal: '1.5 ETH',
      stk_amt: '0.5 ETH',
      stk_rwd: '0.034 ETH'
    }
  ],
  Transactions: [
    {
      tx_hash: '1234567890qwertyuiopasdfghjklzxcvbnm',
      stk_amt: '1.5 ETH',
      stk_rwd: '0.045 ETH',
      date: '01/01/2023',
      apy: '2.1 %',
      status: 'pending',
      operators: ['op 1', 'op 2', 'op 3', 'op 4', 'op 5']
    },
    {
      tx_hash: '1234567890qwertyuiopasdfghjklzxcvbnm',
      stk_amt: '1.5 ETH',
      stk_rwd: '0.045 ETH',
      date: '01/01/2023',
      apy: '2.1 %',
      status: 'pending',
      operators: ['op 1', 'op 2', 'op 3', 'op 4', 'op 5']
    },
  ],
})

const filteredData = ref(tableMockedItems.value[tableView.value])

const filterData = () => {
  let filteredDataArray
  if (searchInput.value === '') {
    filteredDataArray = tableMockedItems.value[tableView.value]
  } else {
    const searchTerm = searchInput.value
    let filteredDataArray =  tableMockedItems.value[tableView.value].filter(item => {
      return (
        // Might need to modify to match types each variable
        item.wallet_provider?.toLowerCase().includes(searchTerm) ||
        item.act?.toLowerCase().includes(searchTerm) ||
        item.bal?.toLowerCase().includes(searchTerm) ||
        item.stk_amt?.toLowerCase().includes(searchTerm) ||
        item.stk_rwd?.toLowerCase().includes(searchTerm) ||
        item.tx_hash?.toLowerCase().includes(searchTerm) ||
        item.date?.toLowerCase().includes(searchTerm) ||
        item.apy?.toLowerCase().includes(searchTerm) ||
        item.status?.toLowerCase().includes(searchTerm) // ||
        // item.operators?.toLowerCase().includes(searchTerm) 
      )
    })
  }

  if(selectedHeader.value !== '' && selectedOrientation.value !== '') {
    filteredDataArray = filteredDataArray.sort((a, b) => {
      const valA = a[selectedHeader.value]
      const valB = b[selectedHeader.value]

      if (selectedOrientation.value === 'ascending') {
        return valA < valB ? -1 : valA > valB ? 1 : 0
      } else if (selectedOrientation.value === 'descending') {
        return valA > valB ? -1 : valA < valB ? 1 : 0
      }
    })
  }

  filteredData.value = filteredDataArray
}

watch([searchInput, tableView, selectedHeader, selectedOrientation], ()=>{
  filterData()
})


const convertString = (inputString: string) => {
  if (inputString.length && inputString.length <= 4) {
    return inputString
  }

  var start = inputString.substring(0, 4)
  var end = inputString.substring(inputString.length - 4)
  var middle = '*'.repeat(4)

  return start + middle + end
}

const convertJsonToCsv = (jsonData) => {
  const separator = ','
  const csvRows = []

  if (!Array.isArray(jsonData)) {
    console.error('jsonData is not an array')
    return ''
  }

  if (jsonData.length === 0) {
    console.warn('jsonData is an empty array')
    return ''
  }

  const keys = Object.keys(jsonData[0])

  // Add headers
  csvRows.push(keys.join(separator))

  // Convert JSON data to CSV rows
  jsonData.forEach(obj => {
    const values = keys.map(key => obj[key])
    csvRows.push(values.join(separator))
  })

  return csvRows.join('\n')
}

const convertJsonToExcelBuffer = (jsonData) => {
  const worksheet = XLSX.utils.json_to_sheet(jsonData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return excelBuffer
}

const downloadFile = (content: any, filename: string, mimeType: any) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  // Cleanup
  URL.revokeObjectURL(url)
}

const exportFile = () => {

  const jsonData = 
    [{
      wallet_provider: 'MetaMask',
      act: '12345678910asdfghjkl;qwertyuiopzxcvbnm',
      bal: '1.5 ETH',
      stk_amt: '0.5 ETH',
      stk_rwd: '0.034 ETH'
    }]

  const isMac = navigator.userAgent.indexOf('Mac') !== -1
  const fileExtension = isMac ? 'csv' : 'xlsx'

  if (fileExtension === 'csv') {
    const csvContent = convertJsonToCsv(jsonData)
    downloadFile(csvContent, `${tableView.value}.csv`, 'text/csv')
  } else {
    const excelBuffer = convertJsonToExcelBuffer(jsonData)
    downloadFile(excelBuffer, `${tableView.value}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }
}
</script>

<template>
  <div class="card_container pt-[42px] pb-[34px] text-black">
    <div class="px-[32px]">
      <div class="flex flex-wrap gap-[20px] justify-between items-start pb-[20px] border-b border-b-[#EAECF0] ">
        <div>
          <div class="flex items-center gap-[8px]">
            <h6 class="card_title">
              {{ tableView }}
            </h6>
          </div>
          <div class="card_subtitle mt-[4px]">
            List of transactions by wallet and staking actions
          </div>
        </div>
        <div class="flex items-start gap-[12px]">
          <button
            class="flex items-center gap-[8px] export_button"
            @click="exportFile()"
          >
            <vue-feather
              type="upload-cloud"
              size="36"
              class="icon w-[17px] h-min"
            />
            Export
          </button>
        </div>
      </div>
      <div class="flex flex-wrap gap-[20px] justify-between py-[20px] items-center border-b border-b-[#EAECF0]">
        <div class="grouped_buttons overflow-hidden">
          <button
            class="timeframe_button"
            :class="tableView === 'Wallets'? 'bg-[#F3F3F3]' : 'bg-[#FFFFFF]'"
            @click="tableView = 'Wallets', selectedHeader = ''"
          >
            Wallets
          </button>
          <button
            class="timeframe_button border-l border-l-[#D0D5DD] " 
            :class="tableView === 'Transactions'? 'bg-[#F3F3F3]' : 'bg-[#FFFFFF]'"
            @click="tableView = 'Transactions', selectedHeader = ''"
          >
            Transactions
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-[12px]">
          <div class="flex items-center gap-[8px] search_bar">
            <vue-feather
              type="search"
              size="36"
              class="icon w-[20px] h-min text-[#667085]"
            />
            <input
              v-model="searchInput"
              type="text"
              class="w-full outline-none"
              placeholder="Search"
            >
          </div>

          <button class="filters_button">
            <vue-feather
              type="filter"
              size="20"
              class="icon w-[20px] h-min"
            />
            Filters
          </button>
        </div>
      </div>
    </div>
    <div class="w-full overflow-x-scroll">
      <table class="w-full">
        <thead>
          <tr class="bg-[#FCFCFD] border-b border-b-[#EAECF0] whitespace-nowrap">
            <th
              v-for="header in tableHeaderOptions[tableView].headers"
              :key="header"
              class="table_header "
            >
              <div class="flex items-center gap-[5px]">
                <div
                  v-if="header.value === 'wallet_provider'"
                  class="flex items-center"
                >
                  <button class="checkbox_button mr-[12px]">
                    <vue-feather
                      type="minus"
                      size="20"
                      class="icon w-[14px] h-min"
                    />
                  </button>
                  Wallet Provider
                </div>
                <div
                  v-else-if="header.value === 'tx_hash'"
                  class="flex items-center"
                >
                  <button class="checkbox_button mr-[12px]">
                    <vue-feather
                      type="minus"
                      size="20"
                      class="icon w-[14px] h-min"
                    />
                  </button>
                  Tx Hash
                </div>
                <div v-else>
                  {{ header.title }}
                </div>
                <button 
                  class="ml-[4px] flex flex-col items-center justify-between"
                  :class="selectedHeader === header.value? 'opacity-100' : 'opacity-25'"
                  @click="selectedHeader = header.value, selectedOrientation === 'ascending'? selectedOrientation = 'descending' : selectedOrientation = 'ascending'"
                >
                  <vue-feather
                    type="arrow-up"
                    size="20"
                    class="icon h-min "
                    :class="selectedOrientation === 'ascending'? 'w-[10px]' : 'w-[8px] opacity-50'"
                  />
                  <vue-feather
                    type="arrow-down"
                    size="20"
                    class="icon h-min"
                    :class="selectedOrientation === 'descending'? 'w-[10px]' : 'w-[8px] opacity-50'"
                  />
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody
          class="w-full"
        >
          <tr
            v-for="item in filteredData"
            :key="item"
            class="w-full text-grey_5 text-body border-b border-grey_2 h-[72px]"
          >
            <td
              v-for="header in tableHeaderOptions[tableView].headers"
              :key="header"
              class="dynamic_padding"
            >
              <div
                v-if="header.value === 'wallet_provider'"
                class="flex items-center gap-[12px]"
              >
                <button class="checkbox_button">
                  <vue-feather
                    type="check"
                    size="20"
                    class="icon w-[14px] h-min"
                  />
                </button>
                <img
                  :src="`/${item[header.value]}.svg`"
                  alt="Avatar "
                  class="w-[20px] h-[20px]"
                >
                <h6 class="title_name 800s:w-[20px] w-[50px] truncate">
                  {{ item[header.value] }}
                </h6>
              </div>
              <div
                v-else-if="header.value === 'act'"
                class="flex items-center gap-[12px] underline"
              >
                <a href=""> 
                  {{ convertString(item[header.value]) }}
                </a>
              </div>
              <div
                v-else-if="header.value === 'tx_hash'"
                class="flex items-center gap-[12px]"
              >
                <button class="checkbox_button mr-[12px]">
                  <vue-feather
                    type="check"
                    size="20"
                    class="icon w-[14px] h-min"
                  />
                </button>
                <a class="w-[55px] truncate underline">
                  {{ convertString(item[header.value]) }}
                </a>
              </div>
              <div
                v-else-if="header.value === 'status'"
                class="flex items-center gap-[12px]"
              >
                <div
                  v-if="item[header.value] === 'staked'"
                  class="flex items-center gap-[8px] status_pill bg-[#ECFDF3] text-[#027A48]"
                >
                  <div class="bg-[#027A48] rounded-[999px] w-[8px] h-[8px]" />
                  Staked
                </div>
                <div
                  v-else-if="item[header.value] === 'pending'" 
                  class="flex items-center gap-[8px] status_pill bg-[#FFFAEB] text-[#B54708]"
                >
                  <div class="bg-[#F79009] rounded-[999px] w-[8px] h-[8px]" />
                  Pending
                </div>
              </div>
              <div
                v-else-if="header.value === 'operators'"
                class="flex items-center gap-[12px] pl-[20px]"
              >
                <div
                  v-for="operator in item[header.value]"
                  :key="operator"
                  :class="`w-[24px] h-[24px] border-[2px] border-white bg-blue-300 rounded-[999px]`"
                  :style="`margin-left: -20px`"
                />
              </div>
              <div v-else>
                {{ item[header.value] }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Waiting on a bigger data set to do this.. for now will comment out -->
    <!-- <div class="flex justify-between items-center mt-[12px]">
      <div class="page_number ml-[56px]">
        Page 1 of 10
      </div>
      <div class="flex items-center gap-[12px]">
        <button class="pagination_button">
          Previous
        </button>
        <button class="pagination_button mr-[33px]">
          Next
        </button>
      </div>
    </div> -->
  </div>
</template>

<style scoped>
.dynamic_padding{
  padding: 12px 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* @media (max-width: 800px) {
    padding: 12px 0px 12px 12px;
  } */
}
.status_pill{
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    padding: 2px 8px 2px 6px;
    border-radius: 16px;
}
.last_assessed_text{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #667085;
}
.rating_percentage{
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #027A48;
}
.rating_text{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
}
.title_name{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #101828;
}
.checkbox_button{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background: #F5F8FF;
    border: 1px solid #ACBFDC;
    border-radius: 6px;
    color: #7D8398;
}
.table_header{
    padding: 12px 24px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    color: #667085;
    text-align: left;
    /* @media (max-width: 800px) {
      padding: 12px 0px 12px 12px;
    } */
}
.pagination_button{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
    padding: 6px 12px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
}
.page_number{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
}
.filters_button {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 10px 16px;
    gap: 8px;
    width: 101px;
    height: 40px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
}
.search_bar{
    width: 316px;
    height: 34px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    padding: 5px 12px;
}
.search_bar input{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 24px;
    color: #667085;
}
.timeframe_button{
    padding: 5px 10px;
    /* background: #FFFFFF; */
    align-items: center;
}
.grouped_buttons{
    border: 1px solid #D0D5DD;
    filter: drop-shadow(0px 1px 2px rgba(16, 24, 40, 0.05));
    border-radius: 8px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #344054;
}
.add_vendor_button{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #FFFFFF;
    padding: 8px 10px;
    background: #0F6AF2;
    border: 1px solid #0F6AF2;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
}
.export_button{
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
    padding: 8px 10px;
}
.card_subtitle{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #667085;
}
.provider_amount_pill{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    color: #344054;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 2px 8px;
    background: #F2F4F7;
    border-radius: 16px;
}
.card_title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    color: #101828;
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
</style>