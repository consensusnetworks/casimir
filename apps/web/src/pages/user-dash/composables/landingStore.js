import { onMounted, ref } from 'vue'
import * as d3 from 'd3'

import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'

const initialized = ref(false)

const { user, removeAccount } = useUsers()
const { connectWallet, logout, loadingUserWallets } = useWallet()

// D3 helpers
const parseTime = d3.timeParse('%d/%m/%Y')
const formatSi = d3.format('.2s')
const tooltipValue = ref('---')

const netWorthTimeFrame = ref('Year')
// netWorthData Schema
// {
//     'date' : 'String'
//     'totalInUSD' : 'Number'
//     'breakdown' : {
//          walletProviders: {
//              MetaMask: 'Number'
//              WalletConnect: 'Number'
//              Coinbase: 'Number'
//              Ledger: 'Number'
//              IoPay: 'Number'
//              Phantom: 'Number'
//              Keplr: 'Number'
//              Trezor: 'Number'
//          }
//          currencies: {
//              ETH: 'Number'
//              BTC: 'Number'
//              IoTeX: 'Number'
//          }
//      }
// }
const netWorthData = ref([])
// TD: use this composable to track user interactions to dynamically update other components
export default function useLandingStore () {

    const calculateNetWorthData = () => {
        const netWorthDataRaw = []
        user.value.accounts.forEach(account => {
            account.balanceSnapshots.forEach(snapshot =>{
                const dateSplit = snapshot.date.split('-')
                const parsedDate = parseTime(dateSplit[2] +'/'+dateSplit[1] +'/'+dateSplit[0])
                const dateIndex = netWorthDataRaw.findIndex(item => 
                    item.date.toDateString() === parsedDate.toDateString()
                )
                // console.log(dateIndex, parsedDate)
                if(dateIndex < 0){ // Date does not exist, add new date to raw array
                    
                    const netWorthDataItem = {
                        // TD: @Howie make snapshot date as an aws date?
                        date: parsedDate,
                        // TD: Make this get balance in usd for the current currency 
                        totalInUSD: 1,
                        breakdown: {
                            walletProviders: {
                                // TD: Make this get balance in usd for the current currency 
                                [account.walletProvider] : 1
                            },
                            currencies: {
                                // TD: Make this get balance in usd for the current currency 
                                [account.currency] : 1
                            }
                        }
                    }
                    netWorthDataRaw.unshift(netWorthDataItem)
                } else { // Date already exists, add values and sum up balance in usd
                    // TD: Make these get balance in usd for the current currency and add it to total
                    netWorthDataRaw[dateIndex].totalInUSD += 1

                    netWorthDataRaw[dateIndex].breakdown.walletProviders[account.walletProvider]? 
                    netWorthDataRaw[dateIndex].breakdown.walletProviders[account.walletProvider] += 1 :
                    netWorthDataRaw[dateIndex].breakdown.walletProviders[account.walletProvider] = 1

                    netWorthDataRaw[dateIndex].breakdown.currencies[account.currency]?
                    netWorthDataRaw[dateIndex].breakdown.currencies[account.currency] += 1 :
                    netWorthDataRaw[dateIndex].breakdown.currencies[account.currency] = 1
                }
            })
        })
        // TD: Make sorting method?
        netWorthData.value = netWorthDataRaw
    }

    // TD: adjust this to fit a wider range of data
    const xAxisFormat = (d) => {
        if(d.getHours() === 0){
            return (d.getMonth() + 1)  + ' / ' + d.getDate()
        } else return ''
    }
    const yAxisFormat = (x) => {
        const s = formatSi(x)
        switch (s[s.length - 1]) {
            case ' G ': return s.slice(0, -1) + ' B ' // billions
            case ' k ': return s.slice(0, -1) + ' K ' // thousands
        }
        return s
    }


    const updateTooltipValue = (e) => {
        tooltipValue.value = '$' + e
    }
    
    onMounted(()=> {
        if(!initialized.value){
            calculateNetWorthData()
            initialized.value = true
        }
    })

    return {
        netWorthTimeFrame,
        netWorthData,
        tooltipValue,
        xAxisFormat,
        yAxisFormat,
        updateTooltipValue,
    }
}