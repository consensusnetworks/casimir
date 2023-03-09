import * as https from 'node:https'

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

export class Exchange {
  coin: 'ETH' | 'BTC'
  currency: 'USD'
  constructor(coin: 'ETH' | 'BTC', currency: 'USD') {
    this.coin = coin
    this.currency = currency
  }

  private async request(options: https.RequestOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = ''

        res.on('data', (d) => {
          data += d
        })

        res.on('end', () => {
          resolve(JSON.parse(data))
        })
      })

      req.on('error', (error) => {
        reject(error)
      })
      req.end()
    })
  }

  async getCurrentPrice(): Promise<any> {
    const now = Math.floor(Date.now() / 1000)
    const data = await this.request({
      port: null,
      method: 'GET',
      host: 'min-api.cryptocompare.com',
      path: `/data/v2/histominute?fsym=${this.coin}&tsym=${this.currency}&toTs=${now}&limit=1`,
      headers: {
        'Content-Length': '0',
      },
    })

    if (data.Response.toLowerCase() !== 'success') {
        throw new Error(data.Message)
    }

    if (data.Data.Data.length === 0) {
        throw new Error('Empty response from API')
    }

    const first = data.Data.Data[0] as PriceEntry
    const mid = (first.high + first.low) / 2
    return mid
  }

  async getPriceAtBlock(time: number): Promise<number> {
    const { Response, Data, Message } = await this.request({
      hostname: 'min-api.cryptocompare.com',
      port: null,
      method: 'GET',
      path: `/data/v2/histohour?fsym=${this.coin}&tsym=${this.currency}&toTs=${time}&limit=1`,
      headers: {
        'Content-Length': '0',
      },
    })

    if (Response.toString().toLowerCase() !== 'success') {
      throw new Error(Message)
    }

    if (Data.Data.length === 0) {
      throw new Error('Empty response from API')
    }

    const nearest = Data.Data[0]
    const mid = (nearest.high + nearest.low) / 2
    return mid
  }

  async getHistoricalPrice({
    interval = 'hour',
  }: { interval?: 'hour' | 'minute' } = {}): Promise<PriceEntry[]> {
	const now = Math.floor(Date.now() / 1000)

    if (interval === 'minute') {
      const sevenDaysPrior = now - 60 * 60 * 24 * 7

      let last = now
      const batch: PriceEntry[] = []

      while (last >= sevenDaysPrior) {
        const {
          Response: response,
          Data: data,
          Message: message,
        } = await this.request({
          hostname: 'min-api.cryptocompare.com',
          port: null,
          method: 'GET',
          path: `/data/v2/histominute?fsym=${this.coin}&tsym=${this.currency}&toTs=${last}&limit=2000`,
          headers: {
            'Content-Length': '0',
          },
        })

        if (response.toString().toLowerCase() !== 'success') {
          throw new Error(message)
        }

        if (data.Data.length === 0) {
          throw new Error('Empty response from API')
        }

        const from = new Date(data.TimeFrom * 1000)
        const to = new Date(data.TimeTo * 1000)

        console.log(`from ${from} to ${to}`)

        data.Data.forEach((price: PriceEntry, i: number) => {
          if (i === 0) {
            return
          }

          if (price.time - data.Data[i - 1].time !== 60) {
            throw new Error(
              `not 1 minute apart: ${price.time} - ${data.Data[i - 1].time}`
            )
          }
        })
        batch.push(...data.Data)
        last = data.TimeFrom
      }
      return batch
    }
    if (interval === 'hour') {
      console.log('getting historical price (hourly)')
      let hlast = now - 60 * 60 * 24 * 7
      const batch: PriceEntry[] = []

      const genesis = Math.floor(new Date(1438269973 * 1000).getTime() / 1000)
      while (hlast > genesis) {
        const {
          Response: hourlyResponse,
          Data: hourlyData,
          Message: hourlyMessage,
        } = await this.request({
          hostname: 'min-api.cryptocompare.com',
          port: null,
          method: 'GET',
          path: `/data/v2/histohour?fsym=${this.coin}&tsym=${this.currency}&toTs=${hlast}&limit=2000`,
          headers: {
            'Content-Length': '0',
          },
        })

        if (hourlyResponse.toString().toLowerCase() !== 'success') {
          throw new Error(hourlyMessage)
        }

        if (hourlyData.Data.length === 0) {
          throw new Error('Empty response from API')
        }

        const from = new Date(hourlyData.TimeFrom * 1000)
        const to = new Date(hourlyData.TimeTo * 1000)

        console.log(`from ${from} to ${to}`)

        hourlyData.Data.forEach((price: PriceEntry, i: number) => {
          if (i === 0) {
            return
          }

          if (price.time - hourlyData.Data[i - 1].time !== 60 * 60) {
            throw new Error(
              `not 1 hour apart: ${price.time} - ${hourlyData.Data[i - 1].time}`
            )
          }
        })

        batch.push(...hourlyData.Data)
        hlast = hourlyData.TimeFrom
      }
      return batch
    }
    throw new Error('invalid interval')
  }
}