import { ethers } from 'ethers'

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
    const exchange = new Exchange('ETH', 'USD')

    async function getExchangeRate(amount: ethers.BigNumber) {
        const eth = ethers.utils.formatEther(amount)

        const price = await exchange.getCurrentPrice()
        const rate = price * parseFloat(eth)
        return rate
    }
    return {
        getExchangeRate
    }
}

class Exchange {
  coin: 'ETH' | 'BTC'
  currency: 'USD'
  constructor(coin: 'ETH' | 'BTC', currency: 'USD') {
    this.coin = coin
    this.currency = currency
  }

  async getCurrentPrice(): Promise<number> {
    const opt = {
        method: 'GET'
    }

    const now = Math.floor(Date.now() / 1000)

    const url = `https://min-api.cryptocompare.com/data/v2/histominute?fsym=${this.coin}&tsym=${this.currency}&toTs=${now}&limit=1`

    try {
        const response = await fetch(url, opt)

        const data = await response.json()

        if (data.Response.toLowerCase() !== 'success') {
            throw new Error(data.Message)
        }

        if (data.Data.Data.length === 0) {
            throw new Error('Empty response from API')
        }

        const first = data.Data.Data[0] as PriceEntry
        const mid = (first.high + first.low) / 2

        return mid
    } catch (e) {
        console.log(e)
        return 0
    }
  }
}