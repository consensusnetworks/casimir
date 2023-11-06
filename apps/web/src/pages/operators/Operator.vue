<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import VueFeather from "vue-feather"
import { ProviderString } from "@casimir/types"
import useAuth from "@/composables/auth"
import useEnvironment from "@/composables/environment"
// import useEthers from '@/composables/ethers'
import useFiles from "@/composables/files"
import useFormat from "@/composables/format"
import useOperators from "@/composables/operators"
import useUser from "@/composables/user"

const { loadingSessionLogin } = useAuth()
const { docsUrl } = useEnvironment()
// const { detectActiveWalletAddress } = useEthers()
const { exportFile } = useFiles()
const { convertString } = useFormat()
const {
    initializeOperatorComposable,
    registerOperatorWithCasimir,
    nonregisteredBaseOperators,
    nonregisteredEigenOperators,
    registeredBaseOperators,
    registeredEigenOperators,
    loadingInitializeOperators,
    loadingAddOperator
} = useOperators()
const { user } = useUser()

// Form inputs
const selectedWallet = ref<{ address: string, walletProvider: ProviderString }>({ address: "", walletProvider: "" })
const openSelectWalletOptions = ref(false)
const onSelectWalletBlur = () => {
    setTimeout(() => {
        openSelectWalletOptions.value = false
    }, 200)
}

const operatorType = ref<"base" | "eigen">("base")
const eigenIsShining = ref(true) // Determines if the shine effect is active
const eigenIsToggled = ref(false) // Determines the toggle state
const toggleBackgroundColor = ref("#eee")  // Initial color

function toggleEigenLayerSupport() {
    eigenIsToggled.value = !eigenIsToggled.value
    toggleBackgroundColor.value = eigenIsToggled.value ? "green" : "#eee"
    operatorType.value = eigenIsToggled.value ? "eigen" : "base"

    // Update stakeType
    // stakeType.value = eigenIsToggled.value ? 'eigen' : 'base'
}

const selectedOperatorID = ref()
const openSelectOperatorID = ref(false)
const onSelectOperatorIDBlur = () => {
    setTimeout(() => {
        openSelectOperatorID.value = false
    }, 200)
}

const availableOperatorIDs = ref([] as string[])
const selectedPublicNodeURL = ref("")
const selectedCollateral = ref()

const openAddOperatorModal = ref(false)
const itemsPerPage = ref(10)
const currentPage = ref(1)
const totalPages = ref(1)
const searchInput = ref("")
const selectedHeader = ref("walletProvider")
const selectedOrientation = ref("ascending")
const operatorTableHeaders = ref(
    [
    // {
    //   title: '',
    //   value: 'blank_column'
    // },
        {
            title: "Operator ID",
            value: "id"
        },
        {
            title: "Wallet Address",
            value: "walletAddress"
        },
        {
            title: "Collateral",
            value: "collateral"
        },
        {
            title: "Active Validators",
            value: "poolCount"
        },
        {
            title: "Node URL",
            value: "nodeURL"
        },
    // {
    //   title: '',
    //   value: 'deactivate'
    // },
    // {
    //   title: '',
    //   value: 'withdraw_collateral'
    // },
    ]
)

const allInputsValid = ref(false)
const tableData = ref<any>([])
const filteredData = ref(tableData.value)
const checkedItems = ref([] as any)

const loading = ref(false)
const submitButtonTxt = ref("Submit")

onMounted(async () => {
    if (user.value) {
        loading.value = true
        await initializeOperatorComposable()

        // Autofill disable
        const disableAutofill = () => {
            let inputs = document.getElementsByTagName("input")
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].setAttribute("autocomplete", "off")
            }
        }

        document.addEventListener("DOMContentLoaded", disableAutofill)

        filterData()
    }
})

watch(user, async () => {
    if (user.value) {
        loading.value = true
        await initializeOperatorComposable()

        filterData()
    }
})

watch(selectedWallet, async () => {
    selectedOperatorID.value = ""
    selectedPublicNodeURL.value = ""
    selectedCollateral.value = ""

    if (selectedWallet.value.address === "") {
        availableOperatorIDs.value = []
    } else if (operatorType.value === "base") {
        if (nonregisteredBaseOperators.value && nonregisteredBaseOperators.value.length > 0) {
            availableOperatorIDs.value = [...nonregisteredBaseOperators.value]
                .filter((operator: any) => operator.ownerAddress === selectedWallet.value.address)
                .map((operator: any) => operator.id)
        } else if (nonregisteredEigenOperators.value && nonregisteredEigenOperators.value.length > 0) {
            availableOperatorIDs.value = [...nonregisteredEigenOperators.value]
                .filter((operator: any) => operator.ownerAddress === selectedWallet.value.address)
                .map((operator: any) => operator.id)
        } else {
            availableOperatorIDs.value = []
        }
    }
})

watch([registeredBaseOperators, registeredEigenOperators], () => {
    loading.value = true
    openAddOperatorModal.value = false
    tableData.value = [...registeredBaseOperators.value, ...registeredEigenOperators.value].map((operator: any) => {
        return {
            id: operator.id,
            walletAddress: operator.ownerAddress,
            collateral: operator.collateral + " ETH",
            poolCount: operator.poolCount,
            nodeURL: operator.url
        }
    })
    filterData()
})

watch(openAddOperatorModal, () => {
    if (openAddOperatorModal.value) {
        selectedWallet.value = { address: user.value?.address as string, walletProvider: user.value?.walletProvider as ProviderString }
    }
})

watch([searchInput,
    selectedHeader,
    selectedOrientation,
    currentPage], () => {
    filterData()
})

const openWalletsModal = () => {
    const el = document.getElementById("connect_wallet_button")
    if (el) {
        el.click()
    }
}

const handleInputChangeCollateral = (event: any) => {
    const value = event.target.value.replace(/[^\d.]/g, "")
    const parts = value.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    // Limit to two decimal places
    if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2)
    }

    // Update the model value
    selectedCollateral.value = parts.join(".")
}

const filterData = () => {
    loading.value = true
    let filteredDataArray

    if (searchInput.value === "") {
        filteredDataArray = tableData.value
    } else {
        const searchTerm = searchInput.value
        filteredDataArray = tableData.value.filter((item: any) => {
            return (
            // Might need to modify to match types each variable
            // item.walletProvider?.toLowerCase().includes(searchTerm) 
                true
            )
        })
    }

    if (selectedHeader.value !== "" && selectedOrientation.value !== "") {
        filteredDataArray = filteredDataArray.sort((a: any, b: any) => {
            const valA = a[selectedHeader.value]
            const valB = b[selectedHeader.value]

            if (selectedOrientation.value === "ascending") {
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
    loading.value = false
}

const removeItemFromCheckedList = (item: any) => {
    const index = checkedItems.value.indexOf(item)
    if (index > -1) {
        checkedItems.value.splice(index, 1)
    }
}

watch([selectedWallet,
    selectedOperatorID,
    selectedPublicNodeURL,
    selectedCollateral], () => {
    if (selectedWallet.value.address !== "" && selectedOperatorID.value !== undefined && selectedPublicNodeURL.value !== "" && selectedCollateral.value !== undefined) {
        allInputsValid.value = true
    } else {
        allInputsValid.value = false
    }
})

async function submitRegisterOperatorForm() {
    const selectedAddress = selectedWallet.value.address
    const selectedProvider = selectedWallet.value.walletProvider

    // const activeAddress = await detectActiveWalletAddress(selectedProvider)
    // if (activeAddress !== selectedAddress) {
    //   return alert(`The account you selected is not the same as the one that is active in your ${selectedProvider} wallet. Please open your browser extension and select the account that you want to log in with.`)
    // }

    try {
        await registerOperatorWithCasimir({
            walletProvider: selectedWallet.value.walletProvider as ProviderString,
            address: selectedWallet.value.address,
            operatorId: parseInt(selectedOperatorID.value),
            collateral: selectedCollateral.value,
            nodeUrl: selectedPublicNodeURL.value
        })
        openAddOperatorModal.value = false
    } catch (error) {
        console.log("Error in submitRegisterOperatorForm :>> ", error)
        openAddOperatorModal.value = false
    }

    if (selectedWallet.value.address === "") {
        const primaryAccount = user.value?.accounts.find(item => { item.address === user.value?.address })
        selectedWallet.value = { address: primaryAccount?.address as string, walletProvider: primaryAccount?.walletProvider as ProviderString }
    }
    selectedOperatorID.value = ""
    selectedPublicNodeURL.value = ""
    selectedCollateral.value = ""
    availableOperatorIDs.value = []
}

const showSkeleton = ref(true)

watch([loadingSessionLogin || loadingInitializeOperators], () => {
    setTimeout(() => {
        if (loadingSessionLogin || loadingInitializeOperators) {
            showSkeleton.value = false
        }
    }, 500)
})

</script>

<template>
  <div class="px-[60px] 800s:px-[5%] pt-[51px]">
    <div class="flex items-start gap-[20px] justify-between flex-wrap mb-[30px]">
      <h6 class="title relative">
        <div
          v-show="showSkeleton || loading"
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
          v-show="showSkeleton || loading"
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
    >
      <div
        v-show="showSkeleton || loading"
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
    >
      <div
        v-show="showSkeleton || loading"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>

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
      </div>

      <div class="w-full overflow-x-scroll pb-20">
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
                    :class="selectedHeader === header.value ? 'opacity-100' : 'opacity-25'"
                    @click="
                      selectedHeader = header.value, 
                      selectedOrientation === 'ascending' ? selectedOrientation = 'descending' : selectedOrientation = 'ascending'
                    "
                  >
                    <vue-feather
                      type="arrow-up"
                      size="20"
                      class="icon h-min "
                      :class="selectedOrientation === 'ascending' ? 'w-[10px]' : 'w-[8px] opacity-50'"
                    />
                    <vue-feather
                      type="arrow-down"
                      size="20"
                      class="icon h-min"
                      :class="selectedOrientation === 'descending' ? 'w-[10px]' : 'w-[8px] opacity-50'"
                    />
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="w-full">
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
                    @click="checkedItems.includes(item) ? removeItemFromCheckedList(item) : checkedItems.push(item)"
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
                  <button
                    class="bg-decline text-white rounded-[3px] px-[8px] py-[4px] text-[14px] font-[500] relative"
                    disabled
                  >
                    <div class="tooltip_container">
                      Coming Soon!
                      <div class="tooltip_triangle" />
                    </div>
                    Deactivate
                  </button>
                </div>
                <div
                  v-if="header.value === 'withdraw_collateral'"
                  class="flex items-center gap-[12px]"
                >
                  <button
                    class="action-button bg-primary text-white rounded-[3px] px-[8px] py-[4px] text-[14px] font-[500] opacity-50 relative"
                    disabled
                  >
                    <div class="tooltip_container">
                      Coming Soon!
                      <div class="tooltip_triangle" />
                    </div>
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
              @click="currentPage > 1 ? currentPage = currentPage - 1 : ''"
            >
              Previous
            </button>
            <button
              class="pagination_button mr-[33px]"
              :disabled="currentPage === totalPages"
              @click="currentPage < totalPages ? currentPage = currentPage + 1 : ''"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div
      v-if="openAddOperatorModal"
      class="fixed top-0 left-0 w-[100%] h-[100vh] bg-black/[0.3] rounded-[3px] z-[2]"
    >
      <div class="flex items-center justify-center w-full h-full">
        <div class="modal_card_container w-[80%] overflow-auto px-[30px] py-[20px]">
          <div class="flex justify-between items-start">
            <div class="flex-grow text-center">
              <h5 class="card_title inline-block align-middle">
                Register Operator
              </h5>
              <div
                class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-15 py-6 my-2 w-full"
                role="alert"
              >
                <p class="text-lg">
                  Learn how to set up a Casimir operator using
                  <a
                    :href="`${docsUrl}/guide/operating`"
                    target="_blank"
                    class="text-primary underline"
                  >
                    our docs
                    <vue-feather
                      type="external-link"
                      size="14"
                    />
                  </a>.
                </p>
              </div>
            </div>
            <!-- An 'X' to cancel out of the modal -->
            <div
              class="shrink-0 relative"
              style="top: -0.5rem;"
            >
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

          <form
            class="grid grid-cols-2 grid-rows-4 gap-x-4 gap-y-6 items-center h-[75%] px-40"
            @submit.prevent="submitRegisterOperatorForm"
          >
            <!-- Wallet address input -->
            <h6 class="font-[400] mt-[15px] mb-[4px] col-span-1">
              Wallet Address:
            </h6>
            <div class="card_input w-full col-span-1 relative">
              <input
                id="walletAddress"
                v-model="selectedWallet.address"
                readonly
                type="text"
                placeholder="Wallet Address.."
                class="outline-none text-grey_4 text-[14px] w-full cursor-pointer"
                @focus="openSelectWalletOptions = true"
                @blur="onSelectWalletBlur"
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 transform -translate-y-1/2"
                @click="selectedWallet = { walletProvider: '', address: '' }"
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
                <h6 class="">
                  Your Connected Wallets
                </h6>
                <button
                  v-for="act in user?.accounts"
                  :key="act.address"
                  type="button"
                  class="border-y border-y-grey_1 hover:border-y-grey_3
                   text-grey_4 my-[10px] w-full flex justify-between truncate"
                  @click="selectedWallet = { address: act.address, walletProvider: act.walletProvider }, openSelectWalletOptions = false"
                >
                  <span>{{ act.walletProvider }}</span>
                  <span>{{ convertString(act.address) }}</span>
                </button>
              </div>
            </div>

            <!-- Operator ID input -->
            <h6 class="font-[400] mt-[15px] mb-[4px] col-span-1">
              Operator ID:
            </h6>
            <div class="card_input w-full col-span-1 relative">
              <input
                id="operator_id"
                v-model="selectedOperatorID"
                type="text"
                readonly
                placeholder="Operator ID.."
                class="outline-none text-grey_4 text-[14px] w-full bg-white cursor-pointer"
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
                <h6>
                  Available Operators
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

            <!-- Public node URL input -->
            <h6 class="font-[400] mt-[15px] mb-[4px] col-span-1">
              DKG Node URL:
            </h6>
            <div class="card_input w-full col-span-1 relative">
              <input
                id="publicNodeURL"
                v-model="selectedPublicNodeURL"
                type="text"
                placeholder="URL.."
                autocomplete="off"
                class="outline-none text-grey_4 text-[14px] w-full"
              >
              <button
                class="absolute right-3 top-1/2 transform -translate-y-1/2"
                @click="selectedPublicNodeURL = ''"
              >
                <vue-feather
                  type="x"
                  class="icon w-[12px] h-min"
                />
              </button>
            </div>

            <!-- Collateral input -->
            <h6 class="font-[400] mt-[15px] mb-[4px] col-span-1">
              Collateral:
            </h6>
            <div class="card_input w-full col-span-1 relative">
              <input
                id="collateral"
                v-model="selectedCollateral"
                type="text"
                placeholder="0.00"
                autocomplete="off"
                class="outline-none text-grey_4 text-[14px] w-full"
                @input="handleInputChangeCollateral"
              >
              <button
                type="button"
                class="absolute right-3 top-1/2 transform -translate-y-1/2"
                @click="selectedCollateral = ''"
              >
                <vue-feather
                  type="x"
                  class="icon w-[12px] h-min"
                />
              </button>
            </div>

            <!-- Submit button -->
            <div class="flex justify-end mt-[10px] col-span-2">
              <button
                type="submit"
                class="export_button"
                :disabled="!allInputsValid"
              >
                <span v-if="loadingAddOperator">Submitting</span>
                <span v-else>Submit</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card_input {
  padding: 0px 8px; /* Adjust as needed */
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
  /* margin-bottom: 6px; */
  height: 34px;
}

.dynamic_padding {
  padding: 12px 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* @media (max-width: 800px) {
    padding: 12px 0px 12px 12px;
  } */
}

.checkbox_button {
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

.table_header {
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

.pagination_button {
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

.page_number {
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

.search_bar {
  width: 316px;
  height: 34px;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  border-radius: 8px;
  padding: 5px 12px;
}

.search_bar input {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  color: #667085;
}

.timeframe_button {
  padding: 5px 10px;
  /* background: #FFFFFF; */
  align-items: center;
}

.grouped_buttons {
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

.add_vendor_button {
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

.export_button {
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

.card_subtitle {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #667085;
}

.provider_amount_pill {
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

.card_title {
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 500;
  font-size: 24px;
  color: #101828;
  margin: 14px 0;
}

.card_container {
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
  border-radius: 3px;
  min-height: 500px;
}

.modal_card_container {
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
  border-radius: 8px;
  height: 500px;
  max-width: 1000px; /* Adjust as needed */
  overflow: auto;
}

/* the form h6 tags */
.modal_card_container h6 {
  font-size: 18px;
  padding-bottom: 10px;
}

.title {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 24px;
  line-height: 31px;
  letter-spacing: -0.03em;
  color: #FFFFFF;
}

/* Eigen Button */
.toggle_container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 10px;
  /* space from the left edge */
  position: relative;
  width: 100%;
  /* takes full width of parent container */
  height: 44px;
  /* adjust as needed if required */
  background-color: rgb(26 12 109);
  /* overflow: hidden; */
  text-align: center;
  color: #fff;
  /* or any suitable color for better visibility */
  font-size: 14px;
  border-radius: 8px;
  transition: background-color 0.3s;
  /* This will animate the color change */
}

.toggle_container:disabled {
  background-color: rgba(26, 12, 109, 0.5);
  /* This makes the purple color lighter (grayed out) */
  /* cursor: not-allowed; This changes the cursor to indicate the button is not clickable */
}

.tooltip_container {
  position: absolute;
  bottom: 100%;
  /* position it above the button */
  left: 50%;
  /* center it horizontally */
  transform: translateX(-50%);
  /* shift it back by half its width to truly center it */
  padding: 8px 12px;
  /* space around the text */
  background-color: #000;
  /* or any desired tooltip color */
  color: #fff;
  /* text color */
  border-radius: 4px;
  /* round the corners */
  opacity: 0;
  /* starts hidden */
  transition: opacity 0.3s;
  /* smooth fade in */
  white-space: nowrap;
  /* prevents the text from wrapping */
  font-size: 12px;
  pointer-events: none;
  /* ensures it doesn't block any interactions */
  z-index: 10;
  /* positions it above other elements */
}

.toggle_container:hover .tooltip_container {
  opacity: 1;
  /* show on hover */
}

.tooltip_triangle {
  position: absolute;
  bottom: -5px;
  /* position at the bottom of the tooltip */
  left: 50%;
  /* center it horizontally */
  transform: translateX(-50%);
  /* shift it back by half its width to truly center it */
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #000;
  /* same color as the tooltip background */
}

button:hover .tooltip_container {
  opacity: 1;
  /* show on hover */
}

/* .shine-effect {
  content: '';
  position: absolute;
  top: -50%;
  left: -150%;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(30deg);
  pointer-events: none;
  animation: shine 2.5s infinite;
} */

/* @keyframes shine {
  0% {
    left: -150%;
  }
  50% {
    left: 150%;
  }
  100% {
    left: 150%;
  }
} */
.toggle-button {
  position: absolute;
  top: 50%;
  right: 10px;
  /* space from the right edge */
  transform: translateY(-50%);
  width: 50px;
  height: 25px;
  background-color: #eee;
  border-radius: 15px;
  cursor: pointer;
  overflow: hidden;
}

.card_container .toggle_container.toggle-on .toggle-button {
  background-color: green !important;
}

.toggle-circle {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background-color: #fff;
  border-radius: 50%;
  transition: left 0.3s;
}

.toggle-on .toggle-circle {
  left: calc(100% - 30px);
}

.eigen-logo {
  height: 20px;
  margin-right: 10px;
}
</style>@/composables/files@/composables/user