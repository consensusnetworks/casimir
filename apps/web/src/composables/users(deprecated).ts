// import { ProviderString, UserWithAccountsAndOperators, ApiResponse, UserAnalyticsData } from '@casimir/types'
// import useEnvironment from '@/composables/environment'

// const { usersUrl } = useEnvironment()

// export default function useUsers() {
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

//     async function getMessage(address: string) {
//         const response = await fetch(`${usersUrl}/auth/${address}`)
//         const json = await response.json()
//         const { message } = json
//         return message
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

//     return {
//         checkIfSecondaryAddress,
//         checkIfPrimaryUserExists,
//         getMessage,
//         setUser,
//         setUserAnalytics,
//     }
// }