// import { UserAnalyticsData } from '@casimir/types'

// export default function useUsers() {
//     async function getMessage(address: string) {
//         const response = await fetch(`${usersUrl}/auth/${address}`)
//         const json = await response.json()
//         const { message } = json
//         return message
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
//         getMessage,
//         setUserAnalytics,
//     }
// }