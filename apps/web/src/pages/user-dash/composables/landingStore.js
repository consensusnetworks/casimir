import { onMounted, ref, watch } from 'vue'
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

const userConnectedProviders = ref([])
const userConnectedCurrencies = ref([])
const selectedAsset = ref({
    provider: null,
    currency: null
})

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
    const convertToUSD = async (currency, date, amount) => {
        const conversion = await getConversionRate(currency, 'USD', date)
        const rate = convertToWholeUnits(currency, amount)
        return conversion * rate
    }

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
                if(dateIndex < 0){ // Date does not exist, add new date to raw array
                    
                    const netWorthDataItem = {
                        // TD: @Howie make snapshot date as an aws date?
                        date: parsedDate,
                        totalInUSD: amount,
                        breakdown: {
                            walletProviders: {
                                [account.walletProvider] : amount,
                            },
                            currencies: {
                                [account.currency] : amount,

                            }
                        }
                    }
                    netWorthDataRaw.unshift(netWorthDataItem)
                } else { 
                    // Date already exists, add values and sum up balance in usd
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

    const calculateUserConnectedProviders = async () => {
        const proiderCollection = []
        const date = new Date()
        const f = d3.format(".2f");

        for (let i = 0; i < user.value.accounts.length; i++) {
            const account = user.value.accounts[i]
            
            const index = proiderCollection.findIndex(item => item.provider === account.walletProvider)
            const balance = await convertToUSD(account.currency, date.toDateString(), account.balance)
            if(index < 0){
                if(selectedAsset.value.currency === null && selectedAsset.value.provider === null){
                    proiderCollection.push({
                        provider: account.walletProvider,
                        balance: Number(f(balance))
                    })
                }else if (selectedAsset.value.currency != null && selectedAsset.value.provider === null){
                    proiderCollection.push({
                        provider: account.walletProvider,
                        balance: account.currency === selectedAsset.value.currency? Number(f(balance)) : 0.00
                    })
                }else if (selectedAsset.value.currency === null && selectedAsset.value.provider != null){
                    proiderCollection.push ({
                        provider: account.walletProvider,
                        balance: account.walletProvider === selectedAsset.value.provider? Number(f(balance)) : '---'
                    })
                }
                
            } else {
                if(selectedAsset.value.currency === null && selectedAsset.value.provider === null){
                    proiderCollection[index] = {
                        provider: account.walletProvider,
                        balance: f(proiderCollection[index].balance + balance)
                    }
                }else if (selectedAsset.value.currency != null && selectedAsset.value.provider === null){
                    proiderCollection[index] = {
                        provider: account.walletProvider,
                        balance: account.currency === selectedAsset.value.currency? Number(f(proiderCollection[index].balance + balance)) : proiderCollection[index].balance
                    }
                }else if (selectedAsset.value.currency === null && selectedAsset.value.provider != null){
                    proiderCollection[index] = {
                        provider: account.walletProvider,
                        balance: account.walletProvider === selectedAsset.value.provider? Number(f(proiderCollection[index].balance + balance)) : proiderCollection[index].balance
                    }
                }
            }
        }
        userConnectedProviders.value = proiderCollection
    }

    const aggergateThroughUserCurrencies = async () => {
        const proiderCollection = []
        const date = new Date()
        const f = d3.format(".2f");
        for (let i = 0; i < user.value.accounts.length; i++) {
            const account = user.value.accounts[i]
            
            const index = proiderCollection.findIndex(item => item.currency === account.currency)
            const balance = await convertToUSD(account.currency, date.toDateString(), account.balance)
            if(index < 0){
                if(selectedAsset.value.currency === null && selectedAsset.value.provider === null){
                    proiderCollection.push({
                        currency: account.currency,
                        balance: Number(f(balance)),
                        ammount: Number(f(convertToWholeUnits(account.currency, account.balance)))
                    })
                }else if (selectedAsset.value.currency != null && selectedAsset.value.provider === null){
                    proiderCollection.push({
                        currency: account.currency,
                        balance: account.currency === selectedAsset.value.currency? Number(f(balance)) : '---',
                        ammount: account.currency === selectedAsset.value.currency? Number(f(convertToWholeUnits(account.currency, account.balance))) : ''
                    })
                }else if (selectedAsset.value.currency === null && selectedAsset.value.provider != null){
                    proiderCollection.push ({
                        currency: account.currency,
                        balance: account.walletProvider === selectedAsset.value.provider? Number(f(balance)) : 0.00,
                        ammount: account.walletProvider === selectedAsset.value.provider?  Number(f(convertToWholeUnits(account.currency, account.balance))) : 0
                    })
                }
                
            } else {
                if(selectedAsset.value.currency === null && selectedAsset.value.provider === null){
                    proiderCollection[index] = {
                        currency: account.currency,
                        balance: Number(f(proiderCollection[index].balance + balance)),
                        ammount: Number(f(proiderCollection[index].ammount + convertToWholeUnits(account.currency, account.balance)))
                    }
                }else if (selectedAsset.value.currency != null && selectedAsset.value.provider === null){
                    proiderCollection[index] = {
                        currency: account.currency,
                        balance: account.currency === selectedAsset.value.currency? Number(f(proiderCollection[index].balance + balance)) : proiderCollection[index].balance ,
                        ammount: account.currency === selectedAsset.value.currency?  Number(f(proiderCollection[index].ammount + convertToWholeUnits(account.currency, account.balance))) : proiderCollection[index].ammount
                    }
                }else if (selectedAsset.value.currency === null && selectedAsset.value.provider != null){
                    proiderCollection[index] = {
                        currency: account.currency,
                        balance: account.walletProvider === selectedAsset.value.provider? Number(f(proiderCollection[index].balance + balance)) : proiderCollection[index].balance ,
                        ammount: account.walletProvider === selectedAsset.value.provider?  Number(f(proiderCollection[index].ammount + convertToWholeUnits(account.currency, account.balance))) : proiderCollection[index].ammount
                    }
                }
            }
        }
        userConnectedCurrencies.value = proiderCollection
    }

    watch(selectedAsset, ()=> {
        calculateUserConnectedProviders()
        aggergateThroughUserCurrencies()
    })
    
    onMounted(()=> {
        if(!initialized.value){
            calculateNetWorthData()
            calculateUserConnectedProviders()
            aggergateThroughUserCurrencies()
            initialized.value = true
        }
    })

    return {
        netWorthTimeFrame,
        netWorthData,
        tooltipValue,
        userConnectedProviders,
        userConnectedCurrencies,
        selectedAsset,
        xAxisFormat,
        yAxisFormat,
        updateTooltipValue,
    }
}