import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useSSV from '@/composables/ssv'
import useWallet from '@/composables/wallet'
import { ProviderString } from '@/types/ProviderString'
import { User } from '@/interfaces/User'
import { onMounted, ref } from 'vue'
import { Currency } from '@/types/Currency'
import { Account } from '@/interfaces/Account'

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


    async function addAccount(provider: ProviderString, address: string, token: Currency) {
        address = address.toLowerCase()
        const account = user.value?.accounts.find((account: Account) => {
            const accountAddress = account.address.toLowerCase()
            const accountProvider = account.walletProvider
            const accountToken = account.currency
            const addressIsEqual = accountAddress === address
            const providerIsEqual = accountProvider === provider
            const tokenIsEqual = accountToken === token
            const isEqual = addressIsEqual && providerIsEqual && tokenIsEqual
            return isEqual
        }) as Account
        if (account) {
            alert(`Account already exists on user: ${account}`)
        } else {
            user.value?.accounts.push({
                address,
                currency: token,
                balance: '0', // TODO: Decide how we want to handle this
                balanceSnapshots: [],
                roi: 0,
                walletProvider: provider
            })
            const requestOptions = {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    primaryAddress: user.value?.address,
                    user: user.value
                })
            }
            const response = await fetch(`${authBaseURL}/users/add-account`, requestOptions)
            console.log('response :>> ', await response.json())
            return response
        }
    
    }

    function removeAccount(provider: ProviderString, address: string) {
        address = address.toLowerCase()
        const localStorage = window.localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts') as string) || {}
        
        if (accounts[provider] && address) {
            accounts[provider] = accounts[provider].filter((account: string) => account !== address)
        }

        for (const provider in accounts) {
            user.value.accounts[provider as ProviderString] = accounts[provider]
        }

        updateUser({ accounts })
    }
    
    async function getMessage(address: string) {
        const response = await fetch(`${authBaseURL}/auth/${address}`)
        const json = await response.json()
        const { message } = json
        console.log('message :>> ', message)
        return message
    }

    async function updatePrimaryAccount(primaryAccount: string, updatedProvider: ProviderString, updatedAccount: string) {
        const requestOptions = {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ primaryAccount, updatedProvider, updatedAccount })
        }
        return await fetch(`${authBaseURL}/users/update-primary-account`, requestOptions)
    }

    return {
        user,
        addAccount,
        removeAccount,
        getMessage,
        updatePrimaryAccount
    }
}