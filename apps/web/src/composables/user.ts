import { onMounted, onUnmounted, readonly, ref } from 'vue'
import { UserWithAccountsAndOperators } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import { ethers } from 'ethers'

// Test address: 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const { ethereumUrl, usersUrl } = useEnvironment()

const initializeComposable = ref(false)
const user = ref<UserWithAccountsAndOperators | undefined>(undefined)
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)

export default function useUser() {
    // TODO: Move back to ethers composable
    async function getEthersBalance(address: string) : Promise<GLfloat> {
        const balance = await provider.getBalance(address)
        return parseFloat(ethers.utils.formatEther(balance))
    }

    onMounted(async () => {
        if (!initializeComposable.value) {
            initializeComposable.value = true
        }
    })
    
    onUnmounted(() => {
        initializeComposable.value = false
    })

    async function setUser(newUserValue: UserWithAccountsAndOperators | undefined) {
        user.value = newUserValue
        await setUserAccountBalances()
    }

    async function setUserAccountBalances() {
        try {
          if (user?.value?.accounts) {
            const { accounts } = user.value
            const accountsWithBalances = await Promise.all(accounts.map(async (account: Account) => {
                const { address } = account
                const balance = await getEthersBalance(address)
                return {
                    ...account,
                    balance
                }
            }))
            user.value.accounts = accountsWithBalances
          }
        } catch (error) {
          throw new Error('Error setting user account balances')
        }
    }

    async function updateUserAgreement(agreed: boolean) {
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agreed })
        }
        return await fetch(`${usersUrl}/user/update-user-agreement/${user.value?.id}`, requestOptions)
    }

    return {
        user: readonly(user),
        setUser,
        updateUserAgreement
    }
}