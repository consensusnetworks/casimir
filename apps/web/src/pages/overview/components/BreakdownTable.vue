<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import VueFeather from 'vue-feather'
import useUser from '@/composables/user'
import useFormat from '@/composables/format'

const { convertString } = useFormat()

const itemsPerPage = ref(7)
const currentPage = ref(1)
const totalPages = ref(1)

const searchInput = ref('')
const tableView = ref('Wallets')

const selectedHeader = ref('wallet_provider')
const selectedOrientation = ref('ascending')

const checkedItems = ref([] as any)

const tableHeaderOptions = ref(
  {
    Wallets: {
      headers: [
        {
          title: '',
          value: 'blank_column'
        },
        {
          title: 'Wallet Provider',
          value: 'wallet_provider'
        },
        {
          title: 'Account',
          value: 'act'
        },
        {
          title: 'Wallet Balance',
          value: 'bal'
        },
        {
          title: 'Stake Balance',
          value: 'stk_amt'
        }, // Need to fetch based on wallet (FE SIDE)
        {
          title: 'Stake Rewards (All-Time)',
          value: 'stk_rwd'
        }, // Need to fetch based on wallet (FE SIDE)
      ]
    },
    Transactions: {
      headers: [
        {
          title: '',
          value: 'blank_column'
        },
        {
          title: 'Date',
          value: 'date'
        },
        {
          title: 'Type',
          value: 'tx_type'
        },
        {
          title: 'Amount',
          value: 'stk_amt'
        },
        {
          title: 'Status',
          value: 'status'
        },
        {
          title: 'Hash',
          value: 'tx_hash'
        }
      ]
    },
    Staking: {
      headers: [
        {
          title: '',
          value: 'blank_column'
        },
        {
          title: 'Date',
          value: 'date'
        },
        {
          title: 'Account',
          value: 'act'
        },
        {
          title: 'Type',
          value: 'type'
        },
        {
          title: 'Amount',
          value: 'amount'
        },
        {
          title: 'Staking Fees',
          value: 'staking_fees'
        },
        {
          title: 'Status',
          value: 'status'
        },
        {
          title: 'Hash',
          value: 'tx_hash'
        },
      ]
    },
  }
)

const { rawUserAnalytics, user } = useUser()

const tableData = ref({
  Wallets: [] as {tx_hash: string, wallet_provider: string,  status: string, staking_fees: string, type: string, amount: string, bal: string,  act: string, date: string, blank_column: any, stk_amt: string, tx_type: string, stk_rwd: string }[],
  Transactions: [] as {tx_hash: string, wallet_provider: string,  status: string, staking_fees: string, type: string, amount: string, bal: string,  act: string, date: string, blank_column: any, stk_amt: string, tx_type: string, stk_rwd: string }[],
  Staking: [] as {tx_hash: string, wallet_provider: string,  status: string, staking_fees: string, type: string, amount: string, bal: string,  act: string, date: string, blank_column: any, stk_amt: string, tx_type: string, stk_rwd: string }[],
})

const filteredData = ref(tableData.value[tableView.value as keyof typeof tableData.value])

const filterData = () => {
  let filteredDataArray

  if (searchInput.value === '') {
    filteredDataArray = tableData.value[tableView.value as keyof typeof tableData.value]
  } else {
    const searchTerm = searchInput.value.toLocaleLowerCase()
    filteredDataArray = (tableData.value[tableView.value as keyof typeof tableData.value] as Array<any>).filter(item => {
      return (
        // Might need to modify to match types each variable
        // {tx_hash: string, wallet_provider: string,  status: string, 
        // staking_fees: string, type: string, amount: string, bal: string,
        // act: string, date: string, blank_column: any, stk_amt: string, 
        // tx_type: string, stk_rwd: string }
        item.wallet_provider?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.act?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.bal?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.stk_amt?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.stk_rwd?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.tx_hash?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.date?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.apy?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.status?.toString().toLocaleLowerCase().includes(searchTerm) || 
        item.type?.toString().toLocaleLowerCase().includes(searchTerm) ||
        item.staking_fees?.toString().toLocaleLowerCase().includes(searchTerm)
      )
    })
  }

  if(selectedHeader.value !== '' && selectedOrientation.value !== '') {
    filteredDataArray = filteredDataArray.sort((a, b) => {
      const valA = a[selectedHeader.value]
      const valB = b[selectedHeader.value]

      if (selectedOrientation.value === 'ascending') {
        return valA < valB ? -1 : valA > valB ? 1 : 0
      } else {
        return valA > valB ? -1 : valA < valB ? 1 : 0
      }
    })
  }
  totalPages.value = Math.round(filteredDataArray.length / itemsPerPage.value)

  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  filteredData.value = filteredDataArray.slice(start, end) as any
}

watch([searchInput, tableView, selectedHeader, selectedOrientation, currentPage], ()=>{
  filterData()
})

const convertJsonToCsv = (jsonData: any[]) => {
  const separator = ','
  const csvRows = []

  if (!Array.isArray(jsonData)) {
    return ''
  }

  if (jsonData.length === 0) {
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

const convertJsonToExcelBuffer = (jsonData: unknown[]) => {
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

  const jsonData = checkedItems.value.length > 0? checkedItems.value : filteredData.value

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

const removeItemFromCheckedList = (item:any) => {
  const index = checkedItems.value.indexOf(item)
  if (index > -1) {
    checkedItems.value.splice(index, 1)
  }
}

const setTableData = () =>{

  if(!rawUserAnalytics.value) return 

  const sortedTransactions = rawUserAnalytics.value.sort((a: any, b: any) => {
    new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  })

  const newTable = tableData.value

  newTable.Transactions = sortedTransactions.map((item: any) =>{
    return {
        tx_hash: item.txId,
        stk_amt: item.amount,
        tx_type: item.txDirection,
        date: item.receivedAt,
        status: item.status,
    }
  })

  let filteredWallets = [] as any
  let filteredStakingTransactions = [] as any
  sortedTransactions.forEach((item: any) => {
    const index = filteredWallets.findIndex((i: any)=> i.act === item.walletAddress)

    if(index > -1) {
      if(new Date(filteredWallets[index].date).getTime() < new Date(item.receivedAt).getTime()){
        filteredWallets[index].bal === item.walletBalance
      }
    } else {
      let provider = user.value?.accounts.find(i => i.address.toLocaleLowerCase() === item.walletAddress.toLocaleLowerCase())?.walletProvider
      filteredWallets.push(
        {
          wallet_provider: provider? provider : 'Unknown',
          act: item.walletAddress,
          bal: item.walletBalance,
          stk_amt: item.amount,
          stk_rwd: item.rewards, // TODO: @Chris we need all-time staking rewards fetched here based on wallet
        }
      )
    }

    if(item.type){
      filteredStakingTransactions.push({
        date: item.receivedAt,
        act: item.walletAddress,
        type: item.type,
        amount: item.amount,
        staking_fees: item.stakeFee,
        status: item.status,
        tx_hash: item.txId
      })
    }
  })

  newTable.Wallets = filteredWallets
  newTable.Staking = filteredStakingTransactions
  tableData.value = newTable

}

const checkAll = ref(false)
watch(checkAll, () =>{
  filteredData.value.map(item =>{
    if(checkAll.value && !checkedItems.value.includes(item)){
      checkedItems.value.push(item)
    }else if(!checkAll && checkedItems.value.includes(item)){
      removeItemFromCheckedList(item)
    }
  })
})

watch(rawUserAnalytics, () =>{
  setTableData()
  filterData()
})

onMounted(() =>{
  setTableData()
  filterData()
})


</script>

<template>
  <div class="card_container pt-[42px] pb-[34px] text-black flex flex-col">
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
            class="flex items-center gap-[8px] export_button h-[38px]"
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
        <div class="grouped_buttons flex flex-nowrap overflow-hidden w-[261px]">
          <button
            class="timeframe_button"
            :class="tableView === 'Wallets'? 'bg-[#F3F3F3]' : 'bg-[#FFFFFF]'"
            @click="tableView = 'Wallets', selectedHeader = 'wallet_provider', checkedItems = [], selectedOrientation = 'ascending'"
          >
            Wallets
          </button>
          <button
            class="timeframe_button border-l border-l-[#D0D5DD] " 
            :class="tableView === 'Transactions'? 'bg-[#F3F3F3]' : 'bg-[#FFFFFF]'"
            @click="tableView = 'Transactions', selectedHeader = 'date', checkedItems = [], selectedOrientation = 'descending'"
          >
            Transactions
          </button>
          <button
            class="timeframe_button border-l border-l-[#D0D5DD]"
            :class="tableView === 'Staking'? 'bg-[#F3F3F3]' : 'bg-[#FFFFFF]'"
            @click="tableView = 'Staking', selectedHeader = 'date', checkedItems = [], selectedOrientation = 'descending'"
          >
            Staking Actions
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-[12px]">
          <div class="flex items-center w-full gap-[12px] search_bar">
            <vue-feather
              type="search"
              class="icon w-[20px] h-min pr-[20px] text-[#667085]"
            />
            <input
              v-model="searchInput"
              type="text"
              class="w-full outline-none"
              placeholder="Search"
            >

            <button @click="searchInput = ''">
              <vue-feather
                type="x"
                class="icon w-[14px] h-min text-[#667085]"
              />
            </button>
          </div>

          <!-- <button class="filters_button">
            <vue-feather
              type="filter"
              size="20"
              class="icon w-[20px] h-min"
            />
            Filters
          </button> -->
        </div>
      </div>
    </div>
    <div class="w-full overflow-x-scroll h-full min-h-[200px]">
      <table class="w-full min-h-[200px] ">
        <thead>
          <tr class="bg-[#FCFCFD] border-b border-b-[#EAECF0] whitespace-nowrap">
            <th
              v-for="header in tableHeaderOptions[tableView as keyof typeof tableHeaderOptions].headers"
              :key="header.title"
              class="table_header "
            >
              <div class="flex items-center gap-[5px]">
                <div
                  v-if="header.value === 'blank_column'"
                  class="flex items-center"
                >
                  <button
                    class="checkbox_button"
                    @click="checkAll = !checkAll"
                  >
                    <vue-feather
                      v-show="checkAll"
                      type="check"
                      size="20"
                      class="icon w-[14px] h-min"
                    />
                  </button>
                </div>
                <div
                  v-if="header.value === 'bal'"
                  class="flex items-center tooltip_container"
                >
                  Wallet Balance

                  <div class="tooltip w-[200px] left-0">
                    Total value of [ethereum] held in the connected wallet addresses. Does not include staked assets.
                  </div>
                </div>
                <div
                  v-else-if="header.value === 'stk_amt'"
                  class="flex items-center tooltip_container"
                >
                  Stake Balance

                  <div class="tooltip w-[200px] left-0">
                    Ethereum actively staked through Casimir from specified wallet address. Does not include withdrawn stake.
                  </div>
                </div>
                <div
                  v-else-if="header.value === 'stk_rwd'"
                  class="flex items-center tooltip_container"
                >
                  Stake Rewards (All-Time)

                  <div class="tooltip w-[200px] right-0">
                    Total rewards earned from ethereum that is currently or has ever been staked through Casimir from specified wallet address. Includes withdrawn and restaked earnings.
                  </div>
                </div>

                <div
                  v-else-if="header.value === 'staking_fees'"
                  class="flex items-center tooltip_container"
                >
                  Staking Fees

                  <div class="tooltip w-[200px] left-0">
                    Staking Fees (in staking actions table)
                    Total fees charged covering Casimir maintenance fee, operator fees, SSV network fee, and the cost of oracle transactions. 
                  </div>
                </div>
                
                <div
                  v-else-if="header.value === 'tx_hash'"
                  class="flex items-center"
                >
                  Tx Hash
                </div>
                <div v-else>
                  {{ header.title }}
                </div>
                <button 
                  class="ml-[4px] h-min"
                  :class="selectedHeader === header.value? 'opacity-100 text-primary' : 'opacity-90 text-grey_4'"
                  @click="selectedHeader = header.value, selectedOrientation === 'ascending'? selectedOrientation = 'descending' : selectedOrientation = 'ascending'"
                >
                  <vue-feather
                    type="arrow-up"
                    size="20"
                    class="icon h-[8px]"
                    :class="selectedOrientation === 'ascending'? 'w-[10px]' : 'w-[8px] opacity-50'"
                  /> 
                  <br>
                  <vue-feather
                    type="arrow-down"
                    size="20"
                    class="icon h-[8px]"
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
            v-for="(item, i) in filteredData"
            :key="i"
            class="w-full text-grey_5 text-body border-b border-grey_2 h-[72px]"
          >
            <td
              v-for="header in tableHeaderOptions[tableView as keyof typeof tableHeaderOptions].headers"
              :key="header.title"
              class="dynamic_padding"
            >
              <div
                v-if="header.value === 'blank_column'"
                class="flex items-center gap-[12px]"
              >
                <button
                  class="checkbox_button"
                  @click="checkedItems.includes(item)? removeItemFromCheckedList(item) : checkedItems.push(item)"
                >
                  <vue-feather
                    v-show="checkedItems.includes(item)"
                    type="check"
                    size="20"
                    class="icon w-[14px] h-min"
                  />
                </button>
              </div>
              <div
                v-if="header.value === 'wallet_provider'"
                class="flex items-center gap-[12px]"
              >
                <img
                  v-if="item[header.value] != 'Unknown'"
                  :src="`/${item[header.value].toLocaleLowerCase()}.svg`"
                  alt="Avatar "
                  class="w-[20px] h-[20px]"
                >
                <h6 class="title_name 800s:w-[20px]">
                  {{ item[header.value ] }}
                </h6>
              </div>
              <div
                v-else-if="header.value === 'act'"
                class="flex items-center gap-[12px] underline"
              >
                <a href="">
                  {{ convertString(item[header.value ]) }}
                </a>
              </div>
              <div
                v-else-if="header.value === 'tx_hash'"
                class="flex items-center gap-[12px]"
              >
                <a class="">
                  {{ convertString(item[header.value ]) }}
                </a>
              </div>
              <div
                v-else-if="header.value === 'status'"
                class="flex items-center gap-[12px]"
              >
                <div
                  v-if="item[header.value ] === 'Active'"
                  class="flex items-center gap-[8px] status_pill bg-[#ECFDF3] text-[#027A48]"
                >
                  <div class="bg-[#027A48] rounded-[999px] w-[8px] h-[8px]" />
                  Staked
                </div>
                <div
                  v-else-if="item[header.value ] === 'Pending'" 
                  class="flex items-center gap-[8px] status_pill bg-[#FFFAEB] text-[#B54708]"
                >
                  <div class="bg-[#F79009] rounded-[999px] w-[8px] h-[8px]" />
                  Pending
                </div>
              </div>
              <div
                v-else-if="header.value === 'bal'"
                class="flex items-center gap-[12px] pl-[20px]"
              >
                {{ item[header.value] }} ETH
              </div>
              <div
                v-else-if="header.value === 'stk_amt'"
                class="flex items-center gap-[12px] pl-[20px]"
              >
                {{ item[header.value] }} ETH
              </div>
              <div
                v-else-if="header.value === 'stk_rwd'"
                class="flex items-center gap-[12px] pl-[20px]"
              >
                {{ item[header.value] }} ETH
              </div>
              <div
                v-else-if="header.value === 'amount'"
                class="flex items-center gap-[12px] pl-[20px]"
              >
                {{ item[header.value] }} ETH
              </div>
              <div
                v-else-if="header.value === 'staking_fees'"
                class="flex items-center gap-[12px] pl-[20px]"
              >
                {{ item[header.value] }} ETH
              </div>
              <div v-else>
                {{ item[header.value as keyof typeof item] }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-between items-center mt-[12px]">
      <div class="page_number ml-[56px]">
        Page {{ totalPages === 0? 0 : currentPage }} of {{ totalPages }}
      </div>
      <div class="flex items-center gap-[12px]">
        <button
          class="pagination_button"
          :disabled="currentPage === 1"
          @click="currentPage > 1? currentPage = currentPage - 1 : ''"
        >
          Previous
        </button>
        <button
          class="pagination_button mr-[33px]"
          :disabled="currentPage === totalPages"
          @click="currentPage < totalPages? currentPage = currentPage + 1 : ''"
        >
          Next
        </button>
      </div>
    </div>
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
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}
</style>@/composables/user