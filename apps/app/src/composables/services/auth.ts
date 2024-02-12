import { onMounted, onUnmounted, readonly, ref } from "vue"
import * as Session from "supertokens-web-js/recipe/session"
import useEnvironment from "@/composables/services/environment"
import useEthers from "@/composables/services/ethers"
// import useLedger from "@/composables/services/ledger"
// import useTrezor from "@/composables/services/trezor"
import router from "@/composables/services/router"
import useUser from "@/composables/services/user"
import useWalletConnect from "@/composables/services/walletConnectV2"
import useWallets from "@/composables/services/wallets"

import {
    Account,
    ApiResponse,
    LoginCredentials,
    ProviderString,
    UserAuthState,
} from "@casimir/types"

const { usersUrl } = useEnvironment()
const { browserProvidersList, loginWithEthers } = useEthers()
// const { loginWithLedger } = useLedger()
// const { loginWithTrezor } = useTrezor()
const { setUser, user, setUserAccountBalances } = useUser()
const { disconnectWalletConnect, loginWithWalletConnectV2 } = useWalletConnect()
const { detectActiveWalletAddress, detectInstalledWalletProviders } = useWallets()

const loadingSession = ref(true)

const initializeComposable = ref(false)

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
                const {
                    data: { sameAddress, walletProvider },
                } = await checkIfPrimaryUserExists(provider as ProviderString, address)
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
                    if (router.currentRoute.value.path === "/") router.push("/")
                    return "Successfully logged in"
                }

                // Then check if address is being used as a secondary account by another user
                const { data: accountsIfSecondaryAddress } = await checkIfSecondaryAddress(address)
                if (accountsIfSecondaryAddress.length) return "Address already exists as a secondary address on another account"

                // Handle user interaction (do they want to sign in with another account?)
                // If yes, log out (and/or log them in with the other account)
                // If no, cancel/do nothing

                const hardwareWallet = provider === "Ledger" || provider === "Trezor"
                const browserWallet = browserProvidersList.includes(provider as ProviderString)

                if (provider === "WalletConnect") {
                    await loginWithProvider(loginCredentials as LoginCredentials)
                    await getUser()
                    if (router.currentRoute.value.path === "/") router.push("/")
                    return "Successfully logged in"
                } else if (hardwareWallet) {
                    await loginWithProvider(loginCredentials as LoginCredentials)
                    await getUser()
                    if (router.currentRoute.value.path === "/") router.push("/")
                    return "Successfully logged in"
                } else if (browserWallet) {
                    const activeAddress = await detectActiveWalletAddress(provider as ProviderString)
                    if (activeAddress === address) {
                        await loginWithProvider({
                            provider: provider as ProviderString,
                            address,
                            currency: "ETH",
                        })
                        if (router.currentRoute.value.path === "/") router.push("/")
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
                // await loginWithLedger(loginCredentials)
            } else if (provider === "Trezor") {
                // await loginWithTrezor(loginCredentials)
            } else if (provider === "WalletConnect") {
                await loginWithWalletConnectV2(loginCredentials)
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
            const promises = [disconnectWalletConnect(), Session.signOut()]
            await Promise.all(promises)
            setUser(undefined)
            router.push("/")
        } catch (error) {
            console.log("Error logging out user :>> ", error)
        }
        // TODO: Fix bug that doesn't allow you to log in without refreshing page after a user logs out
        // window.location.reload()
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


    function performLoginChecklist() {
        detectInstalledWalletProviders()
    }

    // -----------------------------------------
    onMounted(async () => {

        if (!initializeComposable.value) {
            loadingSession.value = true
            initializeComposable.value = true 
            const { user } = await (await fetch(`${usersUrl}/user`)).json()
            performLoginChecklist()
            if (user) {
                setUser(user)
                await setUserAccountBalances()
                // get user active stakes
            }
            loadingSession.value = false
        }
    })

    onUnmounted(() => {
        // 
    })

    return {
        loadingSession: readonly(loadingSession),
        login,
        logout,
        loginWithSecondaryAddress,
    }
}
