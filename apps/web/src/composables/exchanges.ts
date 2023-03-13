
import { Currency } from '@casimir/types'

export default function useExchanges () {
    async function getConversionRate (from: Currency, to: Currency, date: string) {
        const timestamp = Math.floor(new Date(date).getTime() / 1000)
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Apikey ${import.meta.env.PUBLIC_CRYPTO_COMPARE_API_KEY}`
            }
        }
        const response = await fetch (`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${from}&tsyms=${to}&ts=${timestamp}`, options)
        const { [from]: data } = await response.json()
        return data[to]
    }

    function convertToWholeUnits (currency: Currency, amount: number) {
        switch (currency) {
            case 'BTC':
                return amount / 100000000
                break

            case 'ETH':
                return amount / 1000000000000000000
                break
        
            default:
                break
        }
    }


    return { 
        getConversionRate,
        convertToWholeUnits
    }
}