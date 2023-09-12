// import { ref, readonly } from 'vue'
// import { Account, AddAccountOptions, ProviderString, RemoveAccountOptions, UserWithAccountsAndOperators, ApiResponse, UserAnalyticsData } from '@casimir/types'
// import useEnvironment from '@/composables/environment'
// import useEthers from '@/composables/ethers'
// import * as Session from 'supertokens-web-js/recipe/session'
// import useTxData from '../mockData/mock_transaction_data'

// const { txData } = useTxData()
// const { usersUrl } = useEnvironment()

// // 0xd557a5745d4560B24D36A68b52351ffF9c86A212
// const session = ref<boolean>(false)
// const user = ref<UserWithAccountsAndOperators | undefined>(undefined)
// const userAddresses = ref<Array<string>>([])

// export default function useUsers() {
//     async function addAccount(account: AddAccountOptions): Promise<ApiResponse> {
//         try {
//             const requestOptions = {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ account, id: user?.value?.id })
//             }
//             const response = await fetch(`${usersUrl}/user/add-sub-account`, requestOptions)
//             const { error, message, data: updatedUser } = await response.json()
//             setUser(updatedUser)
//             return { error, message, data: updatedUser }
//         } catch (error: any) {
//             throw new Error(error.message || 'Error adding account')
//         }
//     }

//     async function checkIfPrimaryUserExists(provider: ProviderString, address: string): Promise<ApiResponse> {
//         try {
//             const requestOptions = {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             }
//             const response = await fetch(`${usersUrl}/user/check-if-primary-address-exists/${provider}/${address}`, requestOptions)
//             const { error, message, data } = await response.json()
//             if (error) throw new Error(message)
//             return { error, message, data }
//         } catch (error: any) {
//             throw new Error(error.message || 'Error checking if primary user exists')
//         }
//     }

//     async function checkIfSecondaryAddress(address: string) : Promise<ApiResponse> {
//         try {
//             const requestOptions = {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             }
//             const response = await fetch(`${usersUrl}/user/check-secondary-address/${address}`, requestOptions)
//             const { error, message, data } = await response.json()
//             if (error) throw new Error(message)
//             return { error, message, data }
//         } catch (error: any) {
//             throw new Error(error.message || 'Error checking if secondary address')
//         }
//     }

//     /**
//      * Checks if session exists and, if so:
//      * Gets the user's account via the API
//      * Sets the user's account locally
//     */
//     async function checkUserSessionExists() : Promise<boolean> {
//         try {
//             session.value = await Session.doesSessionExist()
//             if (session.value) {
//                 const { data: user } = await getUser()
//                 if (user) {
//                     setUser(user)
//                     return true
//                 } else {
//                     return false
//                 }
//             }
//             return false
//         } catch (error: any) {
//             console.log('Error in checkUserSessionExists in wallet.ts :>> ', error)
//             return false
//         }
//     }

//     async function getAccountBalance(account: Account) {
//         const { getEthersBalance } = useEthers()
//         try {
//             return await getEthersBalance(account.address)
//         } catch (err: any) {
//             throw new Error(err.message || 'There was an error getting the account balance')
//         }
//     }

//     async function getMessage(address: string) {
//         const response = await fetch(`${usersUrl}/auth/${address}`)
//         const json = await response.json()
//         const { message } = json
//         return message
//     }

//     async function getUser() : Promise<ApiResponse> {
//         try {
//             const requestOptions = {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             }
//             const response = await fetch(`${usersUrl}/user`, requestOptions)
//             const { user, error, message } = await response.json()
//             return {
//                 error,
//                 message,
//                 data: user
//             }
//         } catch (error: any) {
//             throw new Error('Error getting user from API route')
//         }
//     }

//     async function removeAccount({ address, currency, ownerAddress, walletProvider }: RemoveAccountOptions) {
//         address = address.toLowerCase()
//         const requestOptions = {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 address,
//                 currency,
//                 id: user?.value?.id,
//                 ownerAddress,
//                 walletProvider,
//             })
//         }
//         const response = await fetch(`${usersUrl}/user/remove-sub-account`, requestOptions)
//         const { data: userAccount } = await response.json()
//         user.value = userAccount
//         return { error: false, message: `Account removed from user: ${userAccount}`, data: userAccount }
//     }

//     function setUser(newUser?: UserWithAccountsAndOperators) {
//         user.value = newUser as UserWithAccountsAndOperators
//         userAddresses.value = newUser?.accounts.map(account => account.address) as Array<string>
//     }

//     function setUserAnalytics(data?: UserAnalyticsData) {
//         if (user.value?.id) {
//             userAnalytics.value = data as UserAnalyticsData
//         } else {
//             const userAnalyticsInit = {
//                 oneMonth: {
//                     labels: [],
//                     data: []
//                 },
//                 sixMonth: {
//                     labels: [],
//                     data: []
//                 },
//                 oneYear: {
//                     labels: [],
//                     data: []
//                 },
//                 historical: {
//                     labels: [],
//                     data: []
//                 }
//             }
//             userAnalytics.value = userAnalyticsInit
//         }
//     }

//     async function setUserAccountBalances() {
//         try {
//           if (user?.value?.accounts) {
//             const { accounts } = user.value
//             const accountsWithBalances = await Promise.all(accounts.map(async (account: Account) => {
//               const balance = await getAccountBalance(account)
//               return {
//                 ...account,
//                 balance
//               }
//             }))

//             // TODO: Should be setting the wallet table balances here as well
//             user.value.accounts = accountsWithBalances
//             setUser(user.value)
//           }
//         } catch (error) {
//           throw new Error('Error setting user account balances')
//         }
//     }

//     async function updatePrimaryAddress(updatedAddress: string) {
//         const userId = user?.value?.id
//         const requestOptions = {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ userId, updatedAddress })
//         }
//         return await fetch(`${usersUrl}/user/update-primary-account`, requestOptions)
//     }

//     return {
//         session,
//         user: readonly(user),
//         userAddresses,
//         addAccount,
//         checkIfSecondaryAddress,
//         checkIfPrimaryUserExists,
//         checkUserSessionExists,
//         getMessage,
//         getUser,
//         removeAccount,
//         setUser,
//         setUserAccountBalances,
//         setUserAnalytics,
//         updatePrimaryAddress,
//     }
// }