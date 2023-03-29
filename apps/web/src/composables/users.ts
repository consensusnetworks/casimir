import { onMounted, ref } from 'vue'
import { AddAccountOptions, ProviderString, RemoveAccountOptions, User } from '@casimir/types'
import { ethers } from 'ethers'
import useEnvironment from '@/composables/environment'
import useSSV from '@/composables/ssv'
import useWallet from '@/composables/wallet'

const { usersBaseURL, ethereumURL } = useEnvironment()

// 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const user = ref<User>()
const { ssvManager } = useSSV()

export default function useUsers () {

    async function getUser() {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        const response = await fetch(`${usersBaseURL}/user`, requestOptions)
        const { user } = await response.json()
        return user
    }

    function setUser(newUser?: User) {
        user.value = newUser
    }

    // Todo filter for events for user addresses
    function subscribeToUserEvents() {
        const { getUserBalance, getUserPools } = useWallet()
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
    
        const validatorInitFilter = {
          address: ssvManager.address,
          topics: [
            ethers.utils.id('ValidatorActivated(uint32,uint32[],string)')
          ]
        }
        ssvManager.connect(provider).on(validatorInitFilter, async () => {
          console.log('ValidatorInit event... updating pools')
          user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
          user.value.pools = await getUserPools(user.value.id)
          user.value.stake = user.value.pools?.reduce((a, c) => a + parseFloat(c.userStake), 0).toString()
          user.value.rewards = user.value.pools?.reduce((a, c) => a + parseFloat(c.userRewards), 0).toString()
        })
    }

    // onMounted(async () => {
    //     const { getUserBalance, getUserPools } = useWallet()
    //     // Just get pools for primary account for demo
    //     user.value.balance = ethers.utils.formatEther(await getUserBalance(user.value.id))
    //     user.value.pools = await getUserPools(user.value.id)
    //     subscribeToUserEvents()
    // })

    async function addAccount(account: AddAccountOptions): Promise<{ error: boolean, message: string, data: User | null }> {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account })
        }
        const response = await fetch(`${usersBaseURL}/user/add-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account added to user: ${userAccount}`, data: userAccount }
    }

    async function removeAccount({ address, currency, ownerAddress, walletProvider }: RemoveAccountOptions) {
        address = address.toLowerCase()
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address,
                currency,
                ownerAddress,
                walletProvider,
            })
        }
        const response = await fetch(`${usersBaseURL}/user/remove-sub-account`, requestOptions)
        const { data: userAccount } = await response.json()
        user.value = userAccount
        return { error: false, message: `Account removed from user: ${userAccount}`, data: userAccount }
    }
    
    async function getMessage(address: string) {
        const response = await fetch(`${usersBaseURL}/auth/${address}`)
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
        return await fetch(`${usersBaseURL}/users/update-primary-account`, requestOptions)
    }

    return {
        user,
        getUser,
        setUser,
        addAccount,
        removeAccount,
        getMessage,
        updatePrimaryAddress
    }
}