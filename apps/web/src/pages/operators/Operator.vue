<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import VueFeather from 'vue-feather'
import { ProviderString } from '@casimir/types'
import useFiles from '@/composables/files'
import useFormat from '@/composables/format'
import useUser from '@/composables/user'
import useOperators from '@/composables/operators'
import { UserWithAccountsAndOperators} from '@casimir/types'

const { exportFile } = useFiles()
const { convertString } = useFormat()
const { user, loadingSessionLogin } = useUser()

// Form inputs
const selectedWallet = ref({address: '', wallet_provider: ''})
const openSelectWalletOptions = ref(false)
const onSelectWalletBlur = () => {
    setTimeout(() =>{
        openSelectWalletOptions.value = false
    }, 200)
}
const selectedOperatorID = ref()
const openSelectOperatorID = ref(false)
const onSelectOperatorIDBlur = () => {
    setTimeout(() => {
        openSelectOperatorID.value = false
    }, 200)
}

const availableOperatorIDs = ref([] as string[])
const selectedPublicNodeURL = ref('')
const selectedCollateral = ref()

const openAddOperatorModal = ref(false)
const itemsPerPage = ref(10)
const currentPage = ref(1)
const totalPages = ref(1)
const searchInput = ref('')
const selectedHeader = ref('wallet_provider')
const selectedOrientation = ref('ascending')
const operatorTableHeaders = ref(
  [
    {
        title: '',
        value: 'blank_column'
    },
    {
        title: 'Operator ID',
        value: 'id'
    },
    {
        title: 'Wallet Address',
        value: 'walletAddress'
    },
    {
        title: 'Collateral',
        value: 'collateral'
    },
    {
        title: 'Active Validators',
        value: 'poolCount'
    },
    {
        title: 'Node URL',
        value: 'nodeURL'
    },
    {
        title: '',
        value: 'deactivate'
    },
    {
        title: '',
        value: 'withdraw_collateral'
    },
  ]
)

const tableData = ref<any>([])
const filteredData = ref(tableData.value)
const checkedItems = ref([] as any)

const loading = ref(false)
const submitButtonTxt = ref('Submit')

onMounted(async () => {
  if (user.value) {

    await initializeComposable(user.value as UserWithAccountsAndOperators)

    // Autofill disable
    const disableAutofill = () => {
      let inputs = document.getElementsByTagName('input')
      for (let i = 0; i < inputs.length; i++) {
          inputs[i].setAttribute('autocomplete', 'off')
      }
    }

    document.addEventListener('DOMContentLoaded', disableAutofill)

    filterData()
  }
})

const {initializeComposable, nonregisteredOperators, registeredOperators, registerOperatorWithCasimir, loadingInitializeOperators } = useOperators()

watch(user, async () => {
  if (user.value) {
    await initializeComposable(user.value as UserWithAccountsAndOperators)

    filterData()
  }
})

watch(selectedWallet, async () =>{
  selectedOperatorID.value = ''
  selectedPublicNodeURL.value = ''
  selectedCollateral.value = ''

  if (selectedWallet.value.address === '') {
    availableOperatorIDs.value = []
  } else if(nonregisteredOperators.value && nonregisteredOperators.value.length > 0) {
    availableOperatorIDs.value = [...nonregisteredOperators.value].filter((operator: any) => operator.ownerAddress === selectedWallet.value.address).map((operator: any) => operator.id)}
})

watch(registeredOperators, () => {
  openAddOperatorModal.value = false
  tableData.value = [...registeredOperators.value].map((operator: any) => {
    return {
      id: operator.id,
      walletAddress: operator.ownerAddress,
      collateral: operator.collateral + ' ETH',
      poolCount: operator.poolCount,
      nodeURL: operator.url
    }
  })
  filterData()
})

watch(openAddOperatorModal, () =>{
  if(openAddOperatorModal.value){
    selectedWallet.value = {address: user.value?.address as string, wallet_provider: user.value?.walletProvider as string}
  }
})

watch([searchInput, selectedHeader, selectedOrientation, currentPage], ()=>{
  filterData()
})



const openWalletsModal = () => {
  const el = document.getElementById('connect_wallet_button')
  if (el) {
    el.click()
  }
}

const handleInputChangeCollateral = (event: any) => {
    const value = event.target.value.replace(/[^\d.]/g, '')
    const parts = value.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    // Limit to two decimal places
    if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2)
    }

    // Update the model value
    selectedCollateral.value = parts.join('.')
}

const filterData = () => {
  let filteredDataArray

  if (searchInput.value === '') {
    filteredDataArray = tableData.value
  } else {
    const searchTerm = searchInput.value
    filteredDataArray = tableData.value.filter((item: any) => {
      return (
        // Might need to modify to match types each variable
        // item.wallet_provider?.toLowerCase().includes(searchTerm) 
        true
      )
    })
  }

  if(selectedHeader.value !== '' && selectedOrientation.value !== '') {
    filteredDataArray = filteredDataArray.sort((a: any, b: any) => {
      const valA = a[selectedHeader.value]
      const valB = b[selectedHeader.value]

      if (selectedOrientation.value === 'ascending') {
        return valA < valB ? -1 : valA > valB ? 1 : 0
      } else {
        return valA > valB ? -1 : valA < valB ? 1 : 0
      }
    })
  }
  totalPages.value = Math.round(filteredDataArray.length / itemsPerPage.value) || 1

  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  filteredData.value = filteredDataArray.slice(start, end) as any
}

const removeItemFromCheckedList = (item:any) => {
  const index = checkedItems.value.indexOf(item)
  if (index > -1) {
    checkedItems.value.splice(index, 1)
  }
}

const allInputsValid = ref(false)

watch([selectedWallet, selectedOperatorID, selectedPublicNodeURL, selectedCollateral], ()=>{
  if(selectedWallet.value.address !== '' && selectedOperatorID.value !== undefined && selectedPublicNodeURL.value !== '' && selectedCollateral.value !== undefined) {
    allInputsValid.value = true
  } else {
    allInputsValid.value = false
  }
})

async function submitRegisterOperatorForm() {
  try {
    await registerOperatorWithCasimir({
      walletProvider: selectedWallet.value.wallet_provider as ProviderString, 
      address: selectedWallet.value.address,
      operatorId: parseInt(selectedOperatorID.value), 
      collateral: selectedCollateral.value,
      nodeUrl: selectedPublicNodeURL.value
    })
    openAddOperatorModal.value = false
  } catch (error) {
    console.log('Error in submitRegisterOperatorForm :>> ', error)
    openAddOperatorModal.value = false
  }

  if (selectedWallet.value.address === '') {
      const primaryAccount = user.value?.accounts.find(item => { item.address === user.value?.address})
      selectedWallet.value = {address: primaryAccount?.address as string, wallet_provider: primaryAccount?.walletProvider as string}
  }
  selectedOperatorID.value = ''
  selectedPublicNodeURL.value = ''
  selectedCollateral.value = ''
  availableOperatorIDs.value = []
}

</script>

<template>
  <div class="px-[60px] 800s:px-[5%] pt-[51px]">
    <div class="flex items-start gap-[20px] justify-between flex-wrap mb-[30px]">
      <h6 class="title relative">
        <div
          v-show="loadingSessionLogin || loadingInitializeOperators"
          class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
        >
          <div class="skeleton_box" />
        </div>
        Operators
      </h6>

      <button
        class="flex items-center gap-[8px] export_button  hover:text-blue_3 hover:border-blue_3 h-[38px] relative"
        :disabled="!user?.accounts"
        @click="openAddOperatorModal = true"
      >
        <div
          v-show="loadingSessionLogin || loadingInitializeOperators"
          class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
        >
          <div class="skeleton_box" />
        </div>
        <vue-feather
          type="plus"
          class="icon w-[17px] h-min"
        />
        Add Operator
      </button>
    </div>
    
    <div
      v-if="!user?.address"
      class="card_container w-full px-[32px] py-[31px]
       text-grey_4 flex items-center justify-center relative"
      style="min-height: calc(100vh - 420px);"
    >
      <div
        v-show="loadingSessionLogin || loadingInitializeOperators"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>
      <div class="border rounded-[3px] border-grey_1 border-dashed p-[10%] text-center">
        <button
          class="text-primary underline"
          @click="openWalletsModal"
        >
          Connect wallet
        </button> to view and register operators... 
      </div>
    </div>

    <div
      v-else
      class="card_container w-full px-[32px] py-[31px] text-black  whitespace-nowrap relative"
      style="min-height: calc(100vh - 320px); height: 500px;"
    >
      <div
        v-show="loadingSessionLogin || loadingInitializeOperators"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>
      <!-- Form -->
      <div
        v-if="openAddOperatorModal"
        class="absolute top-0 left-0 w-full h-full bg-black/[0.2] rounded-[3px] flex items-center justify-center z-[2]"
      >
        <div class="card_container w-[80%] h-[90%] overflow-auto px-[30px] py-[20px]">
          <div class="flex items-center gap-[10px] flex-wrap justify-between">
            <h6 class="card_title">
              Register Operator
            </h6>
            <div class="">
              <button
                type="button"
                class="card_title"
                @click="openAddOperatorModal = false"
              >
                <vue-feather
                  type="x"
                  class="icon w-[17px] h-min"
                />
              </button>
            </div>
          </div>
          <form @submit.prevent="submitRegisterOperatorForm">
            <!-- Wallet address input -->
            <h6 class="text-[12px] font-[500] mt-[15px] mb-[4px] pl-[5px]">
              Wallet
            </h6>
            <div class="card_input w-full max-w-[400px] relative">
              <input
                id="walletAddress"
                v-model="selectedWallet.address"
                readonly
                type="text"
                placeholder="Wallet Address.."
                class="outline-none text-grey_4 text-[12px] w-full cursor-pointer"
                @focus="openSelectWalletOptions = true"
                @blur="onSelectWalletBlur"
              >
              <button
                type="button"
                @click="selectedWallet = { wallet_provider: '', address: ''}"
              >
                <vue-feather
                  type="x"
                  class="icon w-[12px] h-min"
                />
              </button>
              <div
                v-show="openSelectWalletOptions"
                class="z-[3] absolute top-[110%] left-0 w-full border rounded-[8px] border-[#D0D5DD] p-[15px] bg-white max-h-[200px] overflow-auto"
              >
                <h6 class="text-[12px]">
                  Your Connected Wallets
                </h6>
                <button
                  v-for="act in user.accounts"
                  :key="act.address"
                  type="button"
                  class="border-y border-y-grey_1 hover:border-y-grey_3
                   text-grey_4 my-[10px] w-full flex justify-between truncate"
                  @click="selectedWallet = {address: act.address, wallet_provider: act.walletProvider}, openSelectWalletOptions = false"
                >
                  <span>{{ act.walletProvider }}</span>
                  <span>{{ convertString(act.address) }}</span>
                </button>
              </div>
            </div>
            <div class="text-[12px] mt-[4px] text-grey_4 pl-[5px] whitespace-normal">
              Select your SSV owner address 
            </div>

            <!-- operator id input -->
            <h6 class="text-[12px] font-[500] mt-[15px] mb-[4px] pl-[5px]">
              Operator ID
            </h6>
            <div
              class="card_input w-full max-w-[400px] relative"
            >
              <input
                id="operator_id"
                v-model="selectedOperatorID"
                type="text"
                readonly
                placeholder="Operator ID.."
                class=" outline-none text-grey_4 text-[12px] w-full bg-white cursor-pointer"
                autocomplete="off"
                @focus="openSelectOperatorID = true"
                @blur="onSelectOperatorIDBlur"
              >
              <!-- <button
                type="button"
                @click="selectedOperatorID = ''"
              >
                <vue-feather
                  type="x"
                  size=""
                  class="icon w-[12px] h-min"
                />
              </button> -->
              <div
                v-show="openSelectOperatorID"
                class="z-[3] absolute top-[110%] left-0 w-full border rounded-[8px] border-[#D0D5DD] p-[15px] bg-white max-h-[200px] overflow-auto"
              >
                <h6 class="text-[12px]">
                  Avaliable Operators
                </h6>
                <div
                  v-if="availableOperatorIDs.length === 0" 
                  class="border-y border-y-grey_1
                   text-grey_4 my-[10px] text-center truncate"
                >
                  No Operators Found
                </div>
                <button
                  v-for="operator in availableOperatorIDs"
                  v-else
                  :key="operator"
                  type="button"
                  class="border-y border-y-grey_1 hover:border-y-grey_3
                   text-grey_4 my-[10px] w-full flex justify-between truncate"
                  @click="selectedOperatorID = operator"
                >
                  {{ operator }}
                </button>
              </div>
            </div>
            <div class="text-[12px] mt-[4px] text-grey_4 pl-[5px] whitespace-normal">
              <!-- @chris `here` text needs a link to the ssv operator registry-->
              If no operators found with your SSV owner address, register one 
              <a
                href=""
                target="_blank"
                class="text-primary underline"
              >here</a>.
            </div>

            <hr class="my-[20px]">

            <!-- public node url-->
            <h6 class="text-[12px] font-[500] mt-[15px] mb-[4px] pl-[5px]">
              Public Node URL
            </h6>
            <div class="card_input w-full max-w-[400px] relative">
              <input
                id="operator_id"
                v-model="selectedPublicNodeURL"
                type="text"
                placeholder="URL.."
                autocomplete="off"
                class=" outline-none text-grey_4 text-[12px] w-full"
              >
              <button @click="selectedPublicNodeURL = ''">
                <vue-feather
                  type="x"
                  class="icon w-[12px] h-min"
                />
              </button>
            </div>
            <div class="text-[12px] mt-[4px] text-grey_4 pl-[5px]  whitespace-normal">
              <!-- @chris `here` text needs a link to the correct page-->
              Add RockX DKG support to your node as documented
              <a
                href=""
                target="_blank"
                class="text-primary underline"
              >here</a>.
            </div>

            <hr class="my-[20px]">

            <!-- Collateral-->
            <h6 class="text-[12px] font-[500] mt-[15px] mb-[4px] pl-[5px]">
              Collateral
            </h6>
            <div class="card_input w-full max-w-[400px] relative">
              <input
                id="operator_id"
                v-model="selectedCollateral"
                type="text"
                placeholder="0.00"
                autocomplete="off"
                class=" outline-none text-grey_4 text-[12px] w-full"
                @input="handleInputChangeCollateral"
              >
              <button
                type="button"
                @click="selectedCollateral = ''"
              >
                <vue-feather
                  type="x"
                  class="icon w-[12px] h-min"
                />
              </button>
            </div>
            <div class="text-[12px] mt-[4px] text-grey_4 pl-[5px]">
              Deposit at least 1 ETH per validator you plan to run.
            </div>

            <div class="flex justify-end mt-[20px]">
              <button
                type="submit"
                class="export_button"
                :disabled="!allInputsValid"
              >
                <span v-if="loadingRegisteredOperators">Submitting</span>
                <span v-else>Submit</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Page header -->
      <div class="flex flex-wrap gap-[20px] justify-between items-start pb-[20px] border-b border-b-[#EAECF0] ">
        <div>
          <div class="flex items-center gap-[8px]">
            <h6 class="card_title">
              Operators
            </h6>
          </div>
          <div class="card_subtitle mt-[20px]">
            List of operators according to their performance 
          </div>
        </div>
        <div class="flex items-start gap-[12px]">
          <button
            class="flex items-center gap-[8px] export_button h-[38px]"
            @click="exportFile(checkedItems, filteredData)"
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

      <!-- Table -->
      <div class="w-full overflow-x-scroll">
        <table
          v-if="tableData.length > 0"
          class="w-full"
        >
          <thead>
            <tr class="bg-[#FCFCFD] border-b border-b-[#EAECF0] whitespace-nowrap">
              <th
                v-for="header in operatorTableHeaders"
                :key="header.title"
                class="table_header "
              >
                <div class="flex items-center gap-[5px]">
                  <div>
                    {{ header.title }}
                  </div>
                  <button 
                    v-show="header.value != 'blank_column'"
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
                v-for="header in operatorTableHeaders"
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
                  v-if="header.value === 'deactivate'"
                  class="flex items-center gap-[12px]"
                >
                  <!-- TODO: @Chris, wanna hook up this button? -->
                  <button
                    class="bg-decline text-white rounded-[3px] px-[8px] py-[4px] text-[14px] font-[500]"
                  >
                    Deactivate
                  </button>
                </div>
                <div
                  v-if="header.value === 'withdraw_collateral'"
                  class="flex items-center gap-[12px]"
                >
                  <!-- TODO: @Chris, wanna hook up this button? -->
                  <button
                    class="bg-primary text-white rounded-[3px] px-[8px] py-[4px] text-[14px] font-[500] opacity-50"
                    disabled
                  >
                    Withdraw
                  </button>
                </div>
                <div v-else>
                  {{ item[header.value] }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-else
          class="border border-dashed rounded-[3px] my-[20px] text-center py-[20px] px-[5%] whitespace-normal text-[14px] text-grey_3"
        >
          You currently do not have operators registed under your account.
          
          <p class="mt-[30px]">
            Connect wallet or register operators to view their performance.
          </p>
        </div>
      </div>
      <div
        v-if="tableData.length > 0"
        class="flex justify-between items-center mt-[12px]"
      >
        <div class="page_number ml-[56px]">
          Page {{ currentPage }} of {{ totalPages }}
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
  </div>
</template>

<style scoped>
.card_input {
    padding: 4px 10px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
    letter-spacing: -0.01em;
    color: #101828;
    margin-bottom: 6px;
    height: 34px;
}
.dynamic_padding{
  padding: 12px 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* @media (max-width: 800px) {
    padding: 12px 0px 12px 12px;
  } */
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
    line-height: 0px;
    color: #101828;
}
.card_container{
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}
.title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 24px;
    line-height: 31px;
    letter-spacing: -0.03em;
    color: #FFFFFF;
}
</style>@/composables/files@/composables/user