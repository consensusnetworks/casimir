import { onMounted, ref } from 'vue'
import * as d3 from 'd3'

import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'
import useExternal from '@/composables/external'

const {
    getConversionRate,
    convertToWholeUnits
} = useExternal()

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

const convertToUSD = async (currency, date, amount) => {
    const conversion = await getConversionRate(currency, 'USD', date)
    const rate = convertToWholeUnits(currency, amount)
    console.log(rate)
    return conversion * rate
}
// TD: use this composable to track user interactions to dynamically update other components
export default function useLandingStore () {
    

//  a.value =await getConversionRate('ETH', 'USD', '2023-02-06').then((a:any) => {return a})

    const calculateNetWorthData = async () => {
        const netWorthDataRaw = []
        for (let i = 0; i <  user.value.accounts.length; i++) {
            let account =  user.value.accounts[i]
            for (let j = 0; j < account.balanceSnapshots.length; j++) {
                let snapshot = account.balanceSnapshots[j]
                const dateSplit = snapshot.date.split('-')
                const parsedDate = parseTime(dateSplit[2] +'/'+dateSplit[1] +'/'+dateSplit[0])
                const dateIndex = netWorthDataRaw.findIndex(item => 
                    item.date.toDateString() === parsedDate.toDateString()
                )
                const amount = await convertToUSD(account.currency, snapshot.date, snapshot.balance)
                // console.log(dateIndex, parsedDate)
                if(dateIndex < 0){ // Date does not exist, add new date to raw array
                    
                    const netWorthDataItem = {
                        // TD: @Howie make snapshot date as an aws date?
                        date: parsedDate,
                        // TD: Make this get balance in usd for the current currency 
                        totalInUSD: amount,
                        breakdown: {
                            walletProviders: {
                                // TD: Make this get balance in usd for the current currency 
                                [account.walletProvider] : amount,
                            },
                            currencies: {
                                // TD: Make this get balance in usd for the current currency 
                                [account.currency] : amount,

                            }
                        }
                    }
                    netWorthDataRaw.unshift(netWorthDataItem)
                } else { 
                    // Date already exists, add values and sum up balance in usd
                    // TD: Make these get balance in usd for the current currency and add it to total
                    netWorthDataRaw[dateIndex].totalInUSD += amount,

                    netWorthDataRaw[dateIndex].breakdown.walletProviders[account.walletProvider]? 
                    netWorthDataRaw[dateIndex].breakdown.walletProviders[account.walletProvider] += amount :
                    netWorthDataRaw[dateIndex].breakdown.walletProviders[account.walletProvider] = amount

                    netWorthDataRaw[dateIndex].breakdown.currencies[account.currency]?
                    netWorthDataRaw[dateIndex].breakdown.currencies[account.currency] += amount :
                    netWorthDataRaw[dateIndex].breakdown.currencies[account.currency] = amount
                }
            }
        }
        // TD: Make sorting method?
        console.log(netWorthDataRaw)
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