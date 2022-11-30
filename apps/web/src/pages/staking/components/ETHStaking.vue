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
                address: 'asdfasasdf'
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
  <div class="flex flex-col gap-[20px] h-full w-full">
    <div class="flex w-full overflow-auto gap-[20px]">
      <div
        v-for="item in ETHStakingStats"
        :key="item"
        class="pill_primary whitespace-nowrap"
      >
        {{ item }}
      </div>
    </div>
    <div class="min-h-[78%] max-h-[80%] overflow-auto">
      <div class="flex w-full h-full overflow-auto gap-[20px]">
        <div
          class="min-w-[150px] border border-grey_2 border-[2px] p-[15px] flex items-center justify-center gap-[15px] "
        >
          <RouterLink to="/Staking/ETH/Select-Wallet">
            <button class="btn_primary text-body font-bold">
              Stake <img
                src="/Staking-Icon.svg"
                alt="Staking Icon"
              >
            </button>
          </RouterLink>
        </div>
        <div
          v-for="pool in CurrentStakedItems"
          :key="`${pool as any}`"
          class="min-w-[300px] relative border border-grey_2 border-[2px] p-[15px] flex flex-col gap-[15px] overflow-y-auto"
        >
          <div class="absolute top-0 right-0">
            <!-- Add tool tip to whow which wallet is being used -->
            <img
              :src="pool.wallet.provider"
              :alt="pool.wallet.provider"
              class="w-[30px] opacity-[0.2]"
            >
          </div>
          <div class="w-full text-center">
            <h6 class="font-bold text-grey_5">
              {{ pool.totalAmmountStaked }}
            </h6>
          </div>
          <div class="w-full text-center">
            <h6 class="font-bold text-grey_3">
              {{ pool.timeOfStaking }}
            </h6>
          </div>
          <hr>
          <div
            v-for="item in pool.pools"
            :key="`${item as any}`"
            class="bg-grey_1 p-[15px]"
          >
            <div
              v-if="item.status === 'InWaiting'"
              class="flex flex-col w-full gap-[15px] justify-center"
            >
              <h6 class="font-bold text-grey_5">
                {{ item.ammountStaked }}
              </h6>
              <h6 class="font-medium  text-grey_5">
                Pool: {{ item.poolAddress }}
              </h6>
              <hr class="h-[2px] bg-decline">
              <h6 class="font-bold  text-decline p-[10px] border border-decline">
                Not Yet Staked
              </h6>
            </div>
            <div
              v-else-if="item.status === 'Active'" 
              class="flex flex-col w-full gap-[10px] justify-center"
            >
              <h6 class="font-bold text-grey_5">
                {{ item.ammountStaked }}
              </h6>
              <h6 class="font-medium  text-grey_5">
                Pool: {{ item.poolAddress }}
              </h6>
              <hr class="h-[2px] bg-grey_5">
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
    </div>
  </div>
</template>
