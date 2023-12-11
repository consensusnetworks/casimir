import { readonly, ref, watch } from "vue"
import { Account, ProviderString, UserWithAccountsAndOperators } from "@casimir/types"
import useEnvironment from "@/composables/environment"
import { ethers } from "ethers"

const { usersUrl, batchProvider } = useEnvironment()
const user = ref<UserWithAccountsAndOperators | undefined>(undefined)
const userComposableInitialized = ref(false)

export default function useUser() {
    async function initializeUserComposable() {
        if (userComposableInitialized.value) return
        userComposableInitialized.value = true
        watch(user, async () => {
            await setUserAccountBalances()
        })
    }

    function getPathIndex(provider: ProviderString, address: string) {
        const { accounts } = user.value as UserWithAccountsAndOperators
        const target = accounts.find((account: Account) => account.walletProvider === provider && account.address === address)
        return target?.pathIndex
    }

    function setUser(newUserValue: UserWithAccountsAndOperators | undefined) {
        user.value = newUserValue
    }

    async function setUserAccountBalances() {
        try {
            if (user?.value?.accounts) {
                const { accounts } = user.value
                const balancePromises = accounts.map(account => {
                    return batchProvider.getBalance(account.address)
                })
                const balances = await Promise.all(balancePromises)
                const accountsWithBalances = accounts.map((account, index) => ({
                    ...account,
                    balance: parseFloat(ethers.utils.formatEther(balances[index])),
                }))
    
                user.value.accounts = accountsWithBalances
            }
        } catch (error) {
            throw new Error("Error setting user account balances")
        }
    }
    
    async function updateUserAgreement(agreed: boolean) {
        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ agreed }),
        }
        return await fetch(
            `${usersUrl}/user/update-user-agreement/${user.value?.id}`,
            requestOptions
        )
    }
      
    return {
        user: readonly(user),
        initializeUserComposable,
        getPathIndex,
        setUser,
        updateUserAgreement,
    }
}