import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useSSV from '@/composables/ssv'
import useWallet from '@/composables/wallet'
import { ProviderString } from '@/types/ProviderString'
import { User } from '@/interfaces/User'
import { onMounted, ref } from 'vue'

const { _getAuthBaseUrl } = useEnvironment()

const user = ref<User>({
    id: '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
    accounts: {
        MetaMask: ['0xd557a5745d4560B24D36A68b52351ffF9c86A212']
    } as Record<ProviderString, string[]>,
    primaryAccount: '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
    pools: []
})

export default function useUsers () {

    // Commenting out for now to avoid errors
    // const { ethereumURL } = useEnvironment()
    // const { getUserBalance, getUserPools } = useWallet()
    // const { ssv } = useSSV()

    // Todo filter for events for user addresses
    // function subscribeToUserEvents() {
    //     const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    
    //     const validatorInitFilter = {
    //       address: ssv.address,
    //       topics: [
    //         ethers.utils.id('ValidatorInitFullfilled(uint32,uint32[],string)')
    //       ]
    //     }
    //     ssv.connect(provider).on(validatorInitFilter, async () => {
    //       console.log('ValidatorInit event... updating pools')
    //       user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
    //       user.value.pools = await getUserPools(user.value.id)
    //       user.value.stake = user.value.pools?.reduce((a, c) => a + parseFloat(c.userStake), 0).toString()
    //       user.value.rewards = user.value.pools?.reduce((a, c) => a + parseFloat(c.userRewards), 0).toString()
    //     })
    // }

    // onMounted(async () => {
    //     // Just get pools for primary account for demo
    //     user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
    //     user.value.pools = await getUserPools(user.value.id)
    //     subscribeToUserEvents()
    // })

    function updateUser ({ id, accounts } : User) {
        localStorage.setItem('accounts', JSON.stringify(accounts))
    }

    function addAccount(provider: ProviderString, address: string) {
        address = address.toLowerCase()
        const localStorage = window.localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts') as string) || {}

        for (const existingProvider in accounts) {
            if (accounts[existingProvider].includes(address) && existingProvider !== provider) {
                accounts[existingProvider] = accounts[existingProvider].filter((existingAddress: string) => existingAddress !== address)
            }
        }

        if (!accounts[provider] && address) {
            accounts[provider] = [address]
        } else if (address) {
            if (!accounts[provider].includes(address)) {
                accounts[provider].push(address)
            }
        }

        for (const provider in accounts) {
            user.value.accounts[provider as ProviderString] = accounts[provider]
        }
        
        // TODO: Swap in real user
        const id = 'test_user'
        updateUser({id, accounts})
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

        // TODO: Swap in real user
        const id = 'test_user'
        updateUser({id, accounts})
    }
    
    async function getMessage(address: string) {
        const authBaseUrl = _getAuthBaseUrl()
        const response = await fetch(`${authBaseUrl}/auth/${address}`)
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
        const authBaseUrl = _getAuthBaseUrl()
        return await fetch(`${authBaseUrl}/users`, requestOptions)
    }

    return {
        user,
        addAccount,
        removeAccount,
        getMessage,
        updatePrimaryAccount
    }
}