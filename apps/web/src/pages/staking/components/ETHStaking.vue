<script lang="ts" setup>
import { watch } from 'fs'
import { ref, onMounted } from 'vue'


const ETHStakingStats = ref(
    [
      {
        title: 'Staked',
        value: '78.32 ETH | $123,123.12',
        tooltip: 'Total ammount currently staked to SSV'
      },
      {
        title: 'Rewards',
        value: '78.32 ETH | $123,123.12',
        tooltip: 'Total rewards accumulated with current stakes'
      },
      {
        title: 'APR',
        value: '4.11%',
        tooltip: 'Annual Percentage Rate'
      },
    ]
)

const CurrentStakedItems = ref(
    [
        {
            totalAmmountStaked: '5 ETH | $123.12',
            timeOfStaking: '11/30/22',
            wallet: {
                provider: '/coinbase.svg',
                address: 'asdfasasdf',
                name: 'Account One'
            },
            // list of pools distributed in
            pools: [
                {
                    poolAddress: '123123',
                    validatorAddress: '123',
                    // InWaiting || Active
                    status: 'Active',
                    ammountStaked: '5 ETH',
                    rewardsAccumulated: '10 ETH | $123.12',
                    operatorScore: '32%',
                    avgAPR: '2.3%'
                }
            ],
        },
        {
            totalAmmountStaked: '5 ETH | $123.12',
            timeOfStaking: '11/30/22',
            wallet: {
                provider: '/coinbase.svg',
                address: 'asdfasasdf'
            },
            // list of pools distributed in
            pools: [
                {
                    poolAddress: '123123',
                    validatorAddress: '123',
                    // InWaiting || Active
                    status: 'Active',
                    ammountStaked: '2.5 ETH',
                    rewardsAccumulated: '10 ETH | $123.12',
                    operatorScore: '32%',
                    avgAPR: '2.3%'
                },
                {
                    poolAddress: '123123',
                    validatorAddress: '',
                    // InWaiting || Active
                    status: 'InWaiting',
                    ammountStaked: '2.5 ETH',
                    wallet: {
                        provider: '/coinbase.svg',
                        address: 'asdfasasdf'
                    },
                    rewardsAccumulated: '',
                    operatorScore: '',
                    avgAPR: ''
                }
            ],
        },
        {
            totalAmmountStaked: '5 ETH | $123.12',
            timeOfStaking: '11/30/22',
            wallet: {
                provider: '/coinbase.svg',
                address: 'asdfasasdf'
            },
            // list of pools distributed in
            pools: [
                {
                    poolAddress: '123123',
                    validatorAddress: '123',
                    // InWaiting || Active
                    status: 'Active',
                    ammountStaked: '1.25 ETH',
                    rewardsAccumulated: '10 ETH | $123.12',
                    operatorScore: '32%',
                    avgAPR: '2.3%'
                },
                {
                    poolAddress: '123123',
                    validatorAddress: '123',
                    // InWaiting || Active
                    status: 'Active',
                    ammountStaked: '1.25 ETH',
                    rewardsAccumulated: '10 ETH | $123.12',
                    operatorScore: '32%',
                    avgAPR: '2.3%'
                },
                {
                    poolAddress: '123123',
                    validatorAddress: '123',
                    // InWaiting || Active
                    status: 'Active',
                    ammountStaked: '2.5 ETH',
                    rewardsAccumulated: '10 ETH | $123.12',
                    operatorScore: '32%',
                    avgAPR: '2.3%'
                }
            ],
        },
        {
            totalAmmountStaked: '5 ETH | $123.12',
            timeOfStaking: '11/30/22',
            wallet: {
                provider: '/coinbase.svg',
                address: 'asdfasasdf'
            },
            // list of pools distributed in
            pools: [
                {
                    poolAddress: '123123',
                    validatorAddress: '123',
                    // InWaiting || Active
                    status: 'Active',
                    ammountStaked: '2.5 ETH',
                    rewardsAccumulated: '10 ETH | $123.12',
                    operatorScore: '32%',
                    avgAPR: '2.3%'
                },
                {
                    poolAddress: '123123',
                    validatorAddress: '',
                    // InWaiting || Active
                    status: 'InWaiting',
                    ammountStaked: '2.5 ETH',
                    rewardsAccumulated: '',
                    operatorScore: '',
                    avgAPR: ''
                }
            ],
        },
    ]
)

</script>
  
<template>
  <div class="h-full flex flex-col gap-[15px]">
    <!-- add rotating pills here when in overflow -->
    <div>
      <div
        id="pills_container"
        class="flex w-full overflow-auto gap-[20px]"
      >
        <div
          v-for="item in ETHStakingStats"
          :key="`${item as any}`"
          class="pill_primary whitespace-nowrap"
        >
          <span class="text-grey_5 mr-[5px]">
            {{ item.title }}: 
          </span>
          <span>
            {{ item.value }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="h-full overflow-auto border-y border-grey">
      <div
        v-for="pool in CurrentStakedItems"
        :key="`${pool as any}`"
        class="border border-grey_2 border-[1px] p-[15px] mb-[55px]"
      >
        <div class="">
          <h6 class="font-bold text-grey_5 flex justify-between w-full">
            <span>{{ pool.totalAmmountStaked }}</span> 
            <div class="tooltip">
              <span class="text-grey_3 flex gap-[10px] sr-only s_xsm:not-sr-only">
                <span class="w-[100px] truncate">{{ pool.wallet.address }}</span>
                <img
                  :src="pool.wallet.provider"
                  :alt="pool.wallet.provider"
                  class="w-[20px] opacity-[0.2]"
                >
              </span>
              <img
                :src="pool.wallet.provider"
                :alt="pool.wallet.provider"
                class="w-[20px] opacity-[0.2] s_xsm:sr-only not-sr-only"
              >
              <span class="tooltiptext text-body font-bold">
                {{ pool.wallet.name }}: {{ pool.wallet.address }}
              </span>
            </div>
          </h6>
          <hr class="h-[2px] bg-grey my-[20px]">
          <h6 class="font-bold text-grey_3">
            Stake Distribution
          </h6>
          <div
            v-for="item in pool.pools"
            :key="`${item as any}`"
            class="my-[20px] border border-grey border-dashed border-[2px] p-[15px]"
          >
            <div class="flex flex-wrap gap-[20px] justify-between items-center mb-[15px]">
              <h6 class="font-medium  text-grey_5">
                Pool #{{ item.poolAddress }}
              </h6>
              <h6 class="font-bold text-grey_5">
                {{ item.ammountStaked }}
              </h6>
            </div>
            <div
              v-if="item.status === 'InWaiting'"
            >
              <h6 class="font-medium w-full text-center text-decline p-[10px] border border-decline my-[15px]">
                In Waiting: Not Yet Staked
              </h6>
            </div>
            <div
              v-else-if="item.status === 'Active'"
              class="text-grey_5 whitespace-nowrap"
            >
              <h6 class="flex gap-[20px] flex-wrap justify-between items-center mb-[10px] truncate">
                <span class="min-w-[135px] w-[45%] flex gap-[5px] items-center">
                  <!-- add address for link from Shane's format -->
                  Validator: <span class="truncate">{{ item.validatorAddress }}asdfahsdklfj;laksdj;lkajsdl;kfajs;ld</span> 
                  <a
                    href=""
                    target="_blank"
                  ><i class="iconoir-open-new-window text-primary" /></a>
                </span>
                <span>
                  {{ item.operatorScore }} Validator Effectiveness 
                </span>
              </h6>
              <h6 class="flex gap-[20px] flex-wrap justify-between items-center truncate">
                <span>
                  {{ item.rewardsAccumulated }} in Rewards
                </span>
                <span>
                  {{ item.avgAPR }} Validator APR
                </span>
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center gap-[20px]">
      <RouterLink
        to="/stake/eth/select-wallet"
        class="w-full"
      >
        <button
          class="w-full btn_primary font-bold text-body py-[8px]"
        >
          Stake 
          <img
            src="/Staking-Icon.svg"
            alt="Staking Icon"
            class="w-[16px]"
          >
        </button>
      </RouterLink>
      <RouterLink
        to="/stake"
        class="w-[100px]"
      >
        <button class="w-full btn_primary hover:bg-grey_1 border py-[8px] border-primary bg-white text-primary">
          <i class="iconoir-undo-action text-[16px]" />
        </button>
      </RouterLink>
    </div>
  </div>
</template>
