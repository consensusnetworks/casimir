import { onMounted, onUnmounted, readonly, ref, watch } from 'vue'
import * as Session from 'supertokens-web-js/recipe/session'
import { ethers } from 'ethers'
import { Account, LoginCredentials, UserWithAccountsAndOperators } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnect from '@/composables/walletConnectV2'

// Test address: 0xd557a5745d4560B24D36A68b52351ffF9c86A212
const { ethereumUrl, usersUrl } = useEnvironment()
const { ethersProviderList, loginWithEthers } = useEthers()
const { loginWithLedger } = useLedger()
const { loginWithTrezor } = useTrezor()
const { loginWithWalletConnectV2, initializeWalletConnect, uninitializeWalletConnect } = useWalletConnect()

const initializeComposable = ref(false)
const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
const user = ref<UserWithAccountsAndOperators | undefined>(undefined)
const loadingSessionLogin = ref(false)
const loadingSessionLoginError = ref(false)
const loadingSessionLogout = ref(false)
const loadingSessionLogoutError = ref(false)

export default function useUser() {
    async function addAccountToUser({ provider, address, currency }: { provider: string, address: string, currency: string}) {
        const userAccountExists = user.value?.accounts?.some((account: Account | any) => account?.address === address && account?.walletProvider === provider && account?.currency === currency)
        if (userAccountExists) return 'Account already exists for this user'
        const account = {
            userId: user?.value?.id,
            address: address.toLowerCase() as string,
            currency: currency || 'ETH',
            ownerAddress: user?.value?.address.toLowerCase() as string,
            walletProvider: provider
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account, id: user?.value?.id })
        }

        try {
            const response = await fetch(`${usersUrl}/user/add-sub-account`, requestOptions)
            const { error, message, data: updatedUser } = await response.json()
            if (error) throw new Error(message || 'There was an error adding the account')
            user.value = updatedUser
            await setUserAccountBalances()
            return { error, message, data: updatedUser }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding account')
        }
    }

    async function getUser() {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersUrl}/user`, requestOptions)
            const { user: retrievedUser, error } = await response.json()
            if (error) throw new Error(error)
            user.value = retrievedUser
        } catch (error: any) {
            throw new Error('Error getting user from API route')
        }
    }

    /**
     * Uses appropriate provider composable to login or sign up
     * @param provider 
     * @param address 
     * @param currency 
     * @returns 
     */
    async function login(loginCredentials: LoginCredentials, pathIndex?: number) {
        const { provider } = loginCredentials
        try {
            if (ethersProviderList.includes(provider)) {
                await loginWithEthers(loginCredentials)
            } else if (provider === 'Ledger') {
                await loginWithLedger(loginCredentials, JSON.stringify(pathIndex))
            } else if (provider === 'Trezor') {
                await loginWithTrezor(loginCredentials, JSON.stringify(pathIndex))
            } else if (provider === 'WalletConnect'){
                await loginWithWalletConnectV2(loginCredentials)
            } else {
                console.log('Sign up not yet supported for this wallet provider')
            }
            await getUser()
        } catch (error: any) {
            throw new Error(error.message || 'There was an error logging in')
        }
    }

    async function logout() {
        // Loader
        try {
            loadingSessionLogout.value = true
            await Session.signOut()
            user.value = undefined
            loadingSessionLogout.value = false
        } catch (error) {
            loadingSessionLogoutError.value = true
            console.log('Error logging out user :>> ', error)
            loadingSessionLogout.value = false
        }
        // TODO: Fix bug that doesn't allow you to log in without refreshing page after a user logs out
        window.location.reload()
    }
      
    onMounted(async () => {
        if (!initializeComposable.value) {
            initializeComposable.value = true
            // Loader
            try {
                loadingSessionLogin.value = true
                const session = await Session.doesSessionExist()
                if (session) await getUser()
                await initializeWalletConnect()
                loadingSessionLogin.value = false
            } catch (error) {
                loadingSessionLoginError.value = true
                console.log('error getting user :>> ', error)
                loadingSessionLogin.value = false
            }
        }
    })
    
    onUnmounted(() => {
        initializeComposable.value = false
        uninitializeWalletConnect()
    })

    // TODO: Re-enable once we have a way to remove accounts in UI
    // async function removeConnectedAccount() {
    //     if (!user?.value?.address) {
    //       alert('Please login first')
    //     }
    //     if (selectedAddress.value === primaryAddress.value) {
    //       return alert('Cannot remove primary account')
    //     } else if (ethersProviderList.includes(selectedProvider.value)) {
    //       const opts = {
    //         address: selectedAddress.value,
    //         currency: selectedCurrency.value,
    //         ownerAddress: primaryAddress.value,
    //         walletProvider: selectedProvider.value
    //       }
    //       const removeAccountResult = await removeAccount(opts)
    //       if (!removeAccountResult.error) {
    //         setSelectedAddress(removeAccountResult.data.address)
    //         removeAccountResult.data.accounts.forEach((account: Account) => {
    //           if (account.address === selectedAddress.value) {
    //             setSelectedProvider(account.walletProvider as ProviderString)
    //             setSelectedCurrency(account.currency as Currency)
    //           }
    //         })
    //       }
    //     }
    //   }

    async function getEthersBalance(address: string) : Promise<GLfloat> {
        const balance = await provider.getBalance(address)
        return parseFloat(ethers.utils.formatEther(balance))
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

    async function updatePrimaryAddress(updatedAddress: string) {
        const userId = user?.value?.id
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, updatedAddress })
        }
        return await fetch(`${usersUrl}/user/update-primary-account`, requestOptions)
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
        loadingSessionLogin: readonly(loadingSessionLogin),
        loadingSessionLoginError: readonly(loadingSessionLoginError),
        loadingSessionLogout: readonly(loadingSessionLogout),
        loadingSessionLogoutError: readonly(loadingSessionLogoutError),
        addAccountToUser,
        login,
        logout,
        updateUserAgreement,
    }
}