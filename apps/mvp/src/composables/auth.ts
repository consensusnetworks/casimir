import * as Session from "supertokens-web-js/recipe/session"
import { onMounted, onUnmounted, readonly, ref } from "vue"
import useEnvironment from "@/composables/environment"
import useEthers from "@/composables/ethers"
import useLedger from "@/composables/ledger"
import useTrezor from "@/composables/trezor"
import useUser from "@/composables/user"
import useWalletConnect from "@/composables/walletConnect"
import useWallets from "@/composables/wallets"
import {
    Account,
    ApiResponse,
    LoginCredentials,
    ProviderString,
    UserAuthState,
} from "@casimir/types"

const { usersUrl } = useEnvironment()
const { browserProvidersList, loginWithEthers } = useEthers()
const { loginWithLedger } = useLedger()
const { loginWithTrezor } = useTrezor()
const { setUser, user } = useUser()
const { disconnectWalletConnect, loginWithWalletConnect, initializeWalletConnect } = useWalletConnect()
const { detectActiveWalletAddress } = useWallets()

const initializedAuthComposable = ref(false)
const loadingSessionLogin = ref(false)
const loadingSessionLoginError = ref(false)
const loadingSessionLogout = ref(false)
const loadingSessionLogoutError = ref(false)

export default function useAuth() {
    async function addAccountToUser({
        provider,
        address,
        currency,
        pathIndex
    }: {
    provider: string;
    address: string;
    currency: string;
    pathIndex?: number;
  }) {
        const userAccountExists = user.value?.accounts?.some((account: Account | any) =>
            account?.address === address &&
            account?.walletProvider === provider &&
            account?.currency === currency
        )
        if (userAccountExists) return "Account already exists for this user"
        const account = {
            userId: user?.value?.id,
            address: address.toLowerCase() as string,
            currency: currency || "ETH",
            ownerAddress: user?.value?.address.toLowerCase() as string,
            walletProvider: provider,
            pathIndex
        }

        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ account, id: user?.value?.id }),
        }

        try {
            const response = await fetch(
                `${usersUrl}/user/add-sub-account`,
                requestOptions
            )
            const { error, message, data: updatedUser } = await response.json()
            if (error)
                throw new Error(message || "There was an error adding the account")
            setUser(updatedUser)
            return { error, message, data: updatedUser }
        } catch (error: any) {
            throw new Error(error.message || "Error adding account")
        }
    }

    async function getUser() {
        try {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
            const response = await fetch(`${usersUrl}/user`, requestOptions)
            const { user: retrievedUser, error } = await response.json()
            if (error) throw new Error(error)
            setUser(retrievedUser)
        } catch (error: any) {
            throw new Error("Error getting user from API route")
        }
    }

    async function checkIfPrimaryUserExists(
        provider: ProviderString,
        address: string
    ): Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
            const response = await fetch(
                `${usersUrl}/user/check-if-primary-address-exists/${address}`,
                requestOptions
            )
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || "Error checking if primary user exists")
        }
    }

    async function login(
        loginCredentials: LoginCredentials
    ): Promise<UserAuthState> {
        const { address, provider } = loginCredentials
        try {
            if (user.value) {
                // If address already exists on user, do nothing
                const addressExistsOnUser = user.value?.accounts?.some(
                    (account: Account | any) => account?.address === address
                )
                if (addressExistsOnUser) return "Address already exists on this account"

                // Check if it exists as a primary address of a different user
                const { data: { sameAddress } } = 
                    await checkIfPrimaryUserExists(provider as ProviderString, address)
                // If yes, ask user if they want to add it as a secondary to this account or if they want to log in with that account
                if (sameAddress) {
                    return "Address already exists as a primary address on another account"
                    // If they want to add to account, addAccountToUser
                    // If they don't want to add to their account, cancel (or log them out and log in with other account)
                } else {
                    // If no, check if it exists as a secondary address of a different user
                    const { data: accountsIfSecondaryAddress } = await checkIfSecondaryAddress(address)
                    // If yes, alert user that it already exists as a secondary address on another account and ask if they want to add it as a secondary to this account
                    if (accountsIfSecondaryAddress.length) {
                        console.log("accountsIfSecondaryAddress :>> ", accountsIfSecondaryAddress)
                        return "Address already exists as a secondary address on another account"
                    } else {
                        // If no, addAccountToUser
                        await addAccountToUser(loginCredentials)
                        return "Successfully added account to user"
                    }
                }
            } else {
                // Check if address is a primary address and log in if so
                const { data: { sameAddress, walletProvider } } = await checkIfPrimaryUserExists(provider as ProviderString, address)
                if (sameAddress) {
                    await loginWithProvider(loginCredentials as LoginCredentials)
                    return "Successfully logged in"
                }

                // Then check if address is being used as a secondary account by another user
                const { data: accountsIfSecondaryAddress } = await checkIfSecondaryAddress(address)
                console.log("accountsIfSecondaryAddress :>> ", accountsIfSecondaryAddress)
                if (accountsIfSecondaryAddress.length) return "Address already exists as a secondary address on another account"

                // Handle user interaction (do they want to sign in with another account?)
                // If yes, log out (and/or log them in with the other account)
                // If no, cancel/do nothing

                const hardwareWallet = provider === "Ledger" || provider === "Trezor"
                const browserWallet = browserProvidersList.includes(provider as ProviderString)

                if (provider === "WalletConnect") {
                    console.log("got to wallet connect login")
                    await loginWithProvider(loginCredentials as LoginCredentials)
                    await getUser()
                    return "Successfully logged in"
                } else if (hardwareWallet) {
                    await loginWithProvider(loginCredentials as LoginCredentials)
                    await getUser()
                    return "Successfully logged in"
                } else if (browserWallet) {
                    const activeAddress = await detectActiveWalletAddress(provider as ProviderString)
                    if (activeAddress === address) {
                        await loginWithProvider({
                            provider: provider as ProviderString,
                            address,
                            currency: "ETH",
                        })
                        return "Successfully logged in"
                    } else {
                        return "Selected address is not active address in wallet"
                    }
                } else {
                    return "Error in userAuthState"
                }
            }
        } catch (error: any) {
            console.log("Error in userAuthState :>> ", error)
            return "Error in userAuthState"
        }
    }

    async function loginWithSecondaryAddress(loginCredentials: LoginCredentials) {
        const { address, provider } = loginCredentials
        try {
            const hardwareWallet = provider === "Ledger" || provider === "Trezor"
            const browserWallet = browserProvidersList.includes(provider as ProviderString)
            if (hardwareWallet) {
                await loginWithProvider(loginCredentials as LoginCredentials)
                await getUser()
                return "Successfully created account and logged in"
            } else if (browserWallet) {
                const activeAddress = await detectActiveWalletAddress(provider as ProviderString)
                if (activeAddress === address) {
                    await loginWithProvider({ provider: provider as ProviderString, address,currency: "ETH" })
                    return "Successfully created account and logged in"
                } else {
                    return "Selected address is not active address in wallet"
                }
            }
        } catch (err) {
            return "Error in userAuthState"
        }
    }

    async function checkIfSecondaryAddress(
        address: string
    ): Promise<ApiResponse> {
        try {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
            const response = await fetch(
                `${usersUrl}/user/check-secondary-address/${address}`,
                requestOptions
            )
            const { error, message, data } = await response.json()
            if (error) throw new Error(message)
            return { error, message, data }
        } catch (error: any) {
            throw new Error(error.message || "Error checking if secondary address")
        }
    }

    /**
   * Uses appropriate provider composable to login or sign up
   * @param provider
   * @param address
   * @param currency
   * @returns
   */
    async function loginWithProvider(loginCredentials: LoginCredentials) {
        const { provider } = loginCredentials
        try {
            if (browserProvidersList.includes(provider)) {
                await loginWithEthers(loginCredentials)
            } else if (provider === "Ledger") {
                await loginWithLedger(loginCredentials)
            } else if (provider === "Trezor") {
                await loginWithTrezor(loginCredentials)
            } else if (provider === "WalletConnect") {
                await loginWithWalletConnect(loginCredentials)
            } else {
                console.log("Sign up not yet supported for this wallet provider")
            }
            await getUser()
        } catch (error: any) {
            throw new Error(error.message || "There was an error logging in")
        }
    }

    async function logout() {
        try {
            loadingSessionLogout.value = true
            const promises = [disconnectWalletConnect(), Session.signOut()]
            await Promise.all(promises)
            setUser(undefined)
            loadingSessionLogout.value = false
        } catch (error) {
            loadingSessionLogoutError.value = true
            console.log("Error logging out user :>> ", error)
            loadingSessionLogout.value = false
        }
        // TODO: Fix bug that doesn't allow you to log in without refreshing page after a user logs out
        window.location.reload()
    }

    onMounted(async () => {
        if (!initializedAuthComposable.value) {
            initializedAuthComposable.value = true
            // Loader
            try {
                loadingSessionLogin.value = true
                const session = await Session.doesSessionExist()
                if (session) await getUser()
                await initializeWalletConnect() // Can potentially move this elsewhere
                loadingSessionLogin.value = false
            } catch (error) {
                loadingSessionLoginError.value = true
                console.log("error getting user :>> ", error)
                loadingSessionLogin.value = false
            }
        }
    })
    
    // TODO: Re-enable once we have a way to remove accounts in UI
    // async function removeConnectedAccount() {
    //     if (!user?.value?.address) {
    //       alert('Please login first')
    //     }
    //     if (selectedAddress.value === primaryAddress.value) {
    //       return alert('Cannot remove primary account')
    //     } else if (browserProvidersList.includes(selectedProvider.value)) {
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

    async function updatePrimaryAddress(updatedAddress: string) {
        const userId = user?.value?.id
        const requestOptions = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, updatedAddress }),
        }
        return await fetch(
            `${usersUrl}/user/update-primary-account`,
            requestOptions
        )
    }

    return {
        loadingSessionLogin: readonly(loadingSessionLogin),
        loadingSessionLoginError: readonly(loadingSessionLoginError),
        loadingSessionLogout: readonly(loadingSessionLogout),
        loadingSessionLogoutError: readonly(loadingSessionLogoutError),
        login,
        loginWithSecondaryAddress,
        logout,
    }
}
