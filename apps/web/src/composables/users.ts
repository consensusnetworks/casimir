import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useSSV from '@/composables/ssv'
import useWallet from '@/composables/wallet'
import { onMounted, ref } from 'vue'
import { User } from '@casimir/types'
import { Account } from '@casimir/types'
import { Currency } from '@casimir/types'
import { ProviderString } from '@casimir/types'

const { authBaseURL, ethereumURL } = useEnvironment()

const user = ref<User | null>(null)

export default function useUsers () {
    const { ssv } = useSSV()

    // Todo filter for events for user addresses
    function subscribeToUserEvents() {
        const { getUserBalance, getUserPools } = useWallet()
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    
        const validatorInitFilter = {
          address: ssv.address,
          topics: [
            ethers.utils.id('ValidatorInitFullfilled(uint32,uint32[],string)')
          ]
        }
        ssv.connect(provider).on(validatorInitFilter, async () => {
          console.log('ValidatorInit event... updating pools')
          user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
          user.value.pools = await getUserPools(user.value.id)
          user.value.stake = user.value.pools?.reduce((a, c) => a + parseFloat(c.userStake), 0).toString()
          user.value.rewards = user.value.pools?.reduce((a, c) => a + parseFloat(c.userRewards), 0).toString()
        })
    }

    onMounted(async () => {
        const { getUserBalance, getUserPools } = useWallet()
        // Just get pools for primary account for demo
        user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
        user.value.pools = await getUserPools(user.value.id)
        subscribeToUserEvents()
    })

    async function addAccount(provider: ProviderString, address: string, currency: Currency) {
        address = address.toLowerCase()
        const account = user.value?.accounts?.find((account: Account) => {
            const accountAddress = account.address.toLowerCase()
            const accountProvider = account.walletProvider
            const accountCurrency = account.currency
            const addressIsEqual = accountAddress === address
            const providerIsEqual = accountProvider === provider
            const currencyIsEqual = accountCurrency === currency
            const isEqual = addressIsEqual && providerIsEqual && currencyIsEqual
            return isEqual
        }) as Account
        if (account) {
            alert(`Account already exists on user: ${account}`)
            return { error: false, message: `Account already exists on user: ${account}`, data: user.value }
        } else {
            const accountToAdd = {
                address,
                currency,
                balance: '0', // TODO: Decide how we want to handle this
                balanceSnapshots: [],
                roi: 0,
                walletProvider: provider
            }
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: user.value?.address,
                    account: accountToAdd
                })
            }
            const response = await fetch(`${authBaseURL}/users/add-sub-account`, requestOptions)
            const json = await response.json()
            return json
        }
    
    }

    // TODO: Refactor this next. 2/14
    async function removeAccount(provider: ProviderString, address: string, currency: Currency) {
        address = address.toLowerCase()
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                primaryAddress: user.value?.address,
                provider,
                address,
                currency
            })
        }
        return await fetch(`${authBaseURL}/users/remove-sub-account`, requestOptions)
    }
    
    async function getMessage(address: string) {
        const response = await fetch(`${authBaseURL}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        return message
    }

    async function updatePrimaryAddress(primaryAddress: string, updatedProvider: ProviderString, updatedAddress: string) {
        const requestOptions = {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ primaryAddress, updatedProvider, updatedAddress })
        }
        return await fetch(`${authBaseURL}/users/update-primary-account`, requestOptions)
    }

    return {
        user,
        addAccount,
        removeAccount,
        getMessage,
        updatePrimaryAddress
    }
}