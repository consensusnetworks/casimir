import { onMounted, onUnmounted, ref } from "vue"
import * as Session from "supertokens-web-js/recipe/session"
import useEnvironment from "@/composables/services/environment"
import useEthers from "@/composables/services/ethers"
// import useLedger from "@/composables/services/ledger"
// import useTrezor from "@/composables/services/trezor"
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
const { setUser, user } = useUser()
const { disconnectWalletConnect, loginWithWalletConnectV2, initializeWalletConnect, uninitializeWalletConnect } = useWalletConnect()
const { detectActiveWalletAddress } = useWallets()

const initializedAuthComposable = ref(false)
const loadingSessionLogin = ref(false)
const loadingSessionLoginError = ref(false)
const loadingSessionLogout = ref(false)
const loadingSessionLogoutError = ref(false)

const initializeComposable = ref(false)

export default function useToasts() {

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

    async function performLoginChecklist() {
        // perform checklist of items for the user
        // Methods will be imported from the proper composables
        // 1. get user (update user)
        // 2 get all other analytics and such after
    }

    // -----------------------------------------
    onMounted(() => {
        if (!initializeComposable.value) {
            initializeComposable.value = true 
        }
    })

    onUnmounted(() => {
        // 
    })

    return {
        login
    }
}
