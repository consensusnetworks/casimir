<script lang="ts" setup>
import { ref } from 'vue'


const ETHStakingStats = ref(
    [
        'Total Amount Staked: 78.32 ETH | #123,123.11',
        'Total Rewards: 78.32 ETH | $123,123.11',
        '4.11% Anual Reward Rate',
        '11% Avg Fee',
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
      <div class="flex w-full overflow-auto gap-[20px]">
        <div
          v-for="item in ETHStakingStats"
          :key="item"
          class="pill_primary whitespace-nowrap"
        >
          {{ item }}
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
            <span class="text-grey_3 flex gap-[10px] sr-only s_xsm:not-sr-only">
              {{ pool.wallet.address }}
              <img
                :src="pool.wallet.provider"
                :alt="pool.wallet.provider"
                class="w-[20px] opacity-[0.2]"
              >
            </span>
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
                Pool: {{ item.poolAddress }}
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
                <span>
                  Validator: {{ item.validatorAddress }}
                </span>
                <span>
                  {{ item.operatorScore }} Avg Operator Score
                </span>
              </h6>
              <h6 class="flex gap-[20px] flex-wrap justify-between items-center truncate">
                <span>
                  {{ item.rewardsAccumulated }} in Rewards
                </span>
                <span>
                  {{ item.avgAPR }} Avg APR
                </span>
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center gap-[20px]">
      <RouterLink
        to="/Staking/ETH/Select-Wallet"
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
        to="/Staking"
        class="w-[100px]"
      >
        <button class="w-full btn_primary hover:bg-grey_1 border py-[8px] border-primary bg-white text-primary">
          <i class="iconoir-undo-action text-[16px]" />
        </button>
      </RouterLink>
    </div>
  </div>
  <!-- 
          <div
            v-else-if="item.status === 'Active'" 
            class="flex flex-col w-full gap-[10px] justify-center"
          >
            <div class="flex justify-between items-center">
              <h6 class="font-medium  text-grey_5">
                Pool: {{ item.poolAddress }}
              </h6>
              <h6 class="font-bold text-grey_5">
                {{ item.ammountStaked }}
              </h6>
            </div>
            <div class="flex flex-col gap-[15px] border border-grey_5 p-[10px] text-grey_5">
              <h6 class="">
                Validator: {{ item.validatorAddress }}
              </h6>
              <h6 class="">
                {{ item.rewardsAccumulated }} in Rewards
              </h6>
              <h6 class="">
                {{ item.operatorScore }} Avg Operator Score
              </h6>

              <h6 class="">
                {{ item.avgAPR }} Avg APR
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-10 w-full">
      <RouterLink
        to="/Staking/ETH/Select-Wallet"
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
    </div>
  </div> -->
</template>
