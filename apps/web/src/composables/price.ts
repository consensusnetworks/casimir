import { Currency } from "@casimir/types"
import useEnvironment from "./environment"

type PriceEntry = {
    time: number;
    high: number;
    low: number;
    open: number;
    volumeFrom: number;
    volumeTo: number;
    close: number;
    conversionType: string;
    conversionSymbol: string;
};

  
export default function usePrice() {
    const { cryptoCompareApiKey } = useEnvironment()

    function convertToWholeUnits (currency: Currency | string, amount: number) {
        switch (currency) {
        case "BTC":
            return amount / 100000000
            break

        case "ETH":
            return amount / 1000000000000000000
            break
        
        default:
            break
        }
    }
    
    async function getExchangeRate(amount: string) {

        if (amount === "0.0") {
            return 0
        }

        const price = await getCurrentPrice({ coin: "ETH", currency: "USD" })
        const rate = price * parseFloat(amount)

        return rate
    }

    async function getConversionRateByDate (from: Currency, to: Currency, date: string) {
        const timestamp = Math.floor(new Date(date).getTime() / 1000)
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "authorization": `Apikey ${cryptoCompareApiKey}`
            }
        }
        const response = await fetch (`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${from}&tsyms=${to}&ts=${timestamp}`, options)
        const { [from]: data } = await response.json()
        return data[to]
    }

    async function getCurrentPrice({ coin, currency }: { coin: "ETH" | "BTC"; currency: "USD" }) {
        const opt = {
            method: "GET"
        }
    
        const now = Math.floor(Date.now() / 1000)
    
        const url = `https://min-api.cryptocompare.com/data/v2/histominute?fsym=${coin}&tsym=${currency}&toTs=${now}&limit=1`
    
        try {
            const response = await fetch(url, opt)
    
            const data = await response.json()
    
            if (data.Response.toLowerCase() !== "success") {
                throw new Error(data.Message)
            }
    
            if (data.Data.Data.length === 0) {
                throw new Error("Empty response from API")
            }
    
            const first = data.Data.Data[0] as PriceEntry
            const mid = (first.high + first.low) / 2
    
            return mid
        } catch (e) {
            console.log(e)
            return 0
        }
    }

    return {
        convertToWholeUnits,
        getCurrentPrice,
        getExchangeRate,
        getConversionRateByDate,
    }
}