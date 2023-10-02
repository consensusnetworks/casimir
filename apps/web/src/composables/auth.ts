import * as Session from 'supertokens-web-js/recipe/session'
import { onMounted, onUnmounted, readonly, ref } from 'vue'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
// import useLedger from '@/composables/ledger'
// import useTrezor from '@/composables/trezor'
import useUser from '@/composables/user'
// import useWalletConnect from '@/composables/walletConnectV2'
import { Account, ApiResponse, LoginCredentials, ProviderString, SignInWithEthereumCredentials } from '@casimir/types'

const { domain, origin, usersUrl } = useEnvironment()
const { ethersProviderList, loginWithEthers } = useEthers()
// const { loginWithLedger } = useLedger()
// const { loginWithTrezor } = useTrezor()
const { setUser, user } = useUser()
// const { loginWithWalletConnectV2, initializeWalletConnect, uninitializeWalletConnect } = useWalletConnect()

const initializedAuthComposable = ref(false)
const loadingSessionLogin = ref(false)
const loadingSessionLoginError = ref(false)
const loadingSessionLogout = ref(false)
const loadingSessionLogoutError = ref(false)

export default function useAuth() {
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
            await setUser(updatedUser)
            return { error, message, data: updatedUser }
        } catch (error: any) {
            throw new Error(error.message || 'Error adding account')
        }
    }

    async function checkIfPrimaryUserExists(provider: ProviderString, address: string): Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersUrl}/user/check-if-primary-address-exists/${address}`, requestOptions)
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error checking if primary user exists')
        }
    }

    async function checkIfSecondaryAddress(address: string) : Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            const response = await fetch(`${usersUrl}/user/check-secondary-address/${address}`, requestOptions)
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || 'Error checking if secondary address')
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
            await setUser(retrievedUser)
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
                // await loginWithLedger(loginCredentials, JSON.stringify(pathIndex))
            } else if (provider === 'Trezor') {
                // await loginWithTrezor(loginCredentials, JSON.stringify(pathIndex))
            } else if (provider === 'WalletConnect'){
                // await loginWithWalletConnectV2(loginCredentials)
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
            await setUser(undefined)
            loadingSessionLogout.value = false
        } catch (error) {
            loadingSessionLogoutError.value = true
            console.log('Error logging out user :>> ', error)
            loadingSessionLogout.value = false
        }
        // TODO: Fix bug that doesn't allow you to log in without refreshing page after a user logs out
        window.location.reload()
    }

    /**
     * Creates the message from the server to sign, which includes getting the nonce from auth server
     * 
     * @param {ProviderString} address - The address the user is using to sign in
     * @param {string} statement - The statement the user is signing
     * @returns {Promise<Response>} - The response from the message request
     */ 
    async function createSiweMessage(address: string, statement: string) {
        try {
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address
                })
            }
            const res = await fetch(`${usersUrl}/auth/nonce`, requestOptions)
            const { error, message: resMessage, data: nonce } = (await res.json())
            if (error) throw new Error(resMessage)
            const message = {
                domain,
                address,
                statement,
                uri: origin,
                version: '1',
                chainId: 5,
                nonce
            }
            return prepareMessage(message)
        } catch (error: any) {
            throw new Error(error.message || 'Error creating SIWE message')
        }
    }

    onMounted(async () => {
        if (!initializedAuthComposable.value) {
            initializedAuthComposable.value = true
            // Loader
            try {
                loadingSessionLogin.value = true
                const session = await Session.doesSessionExist()
                if (session) await getUser()
                // await initializeWalletConnect() // Can potentially move this elsewhere
                loadingSessionLogin.value = false
            } catch (error) {
                loadingSessionLoginError.value = true
                console.log('error getting user :>> ', error)
                loadingSessionLogin.value = false
            }
        }
    })

    onUnmounted(() => {
        initializedAuthComposable.value = false
        // uninitializeWalletConnect()
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

    /**
     * Signs user up if they don't exist, otherwise
     * logs the user in with an address, message, and signed message
     * 
     * @param {SignInWithEthereumCredentials} signInWithEthereumCredentials - The user's address, provider, currency, message, and signed message 
     * @returns {Promise<Response>} - The response from the login request
     */
    async function signInWithEthereum(signInWithEthereumCredentials: SignInWithEthereumCredentials): Promise<void> {
        try {
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signInWithEthereumCredentials)
            }
            const response = await fetch(`${usersUrl}/auth/login`, requestOptions)
            const { error, message } = await response.json()
            if (error) throw new Error(message)
        } catch (error: any) {
            throw new Error(error.message || 'Error signing in with Ethereum')
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

    return {
        loadingSessionLogin: readonly(loadingSessionLogin),
        loadingSessionLoginError: readonly(loadingSessionLoginError),
        loadingSessionLogout: readonly(loadingSessionLogout),
        loadingSessionLogoutError: readonly(loadingSessionLogoutError),
        addAccountToUser,
        checkIfPrimaryUserExists,
        checkIfSecondaryAddress,
        login,
        logout,
        createSiweMessage,
        signInWithEthereum
    }
}

function prepareMessage(obj: any) {
    const {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
    } = obj
  
    const issuedAt = new Date().toISOString()
    const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}`
  
    return message
}