import * as https from 'https'
import { upload } from '@casimir/helpers'

type PriceEntry = {
	time: number
	high: number
	low: number
	open: number
	volumeFrom: number
	volumeTo: number
	close: number
	conversionType: string
	conversionSymbol: string
}

export class Exchange {
	coin: 'ETH' | 'BTC'
	currency: 'USD'
	constructor(coin: 'ETH' | 'BTC' = 'ETH', currency: 'USD' = 'USD') {
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

	async getPriceAtTime(time: number): Promise<PriceEntry> {
		const { Response: response, Data: data} = await this.request({
			hostname: 'min-api.cryptocompare.com',
			port: null,
			method: 'GET',
			path: `/data/v2/histominute?fsym=${this.coin}&tsym=${this.currency}&toTs=${time}&limit=1`,
			headers: {
				'Content-Length': '0'
			},
		})

		if (response.toString().toLowerCase() !== 'success') {
			throw new Error('Unable to get price')
		}

		if (data.Data.length === 0) {
			throw new Error('Unable to get price')
		}

		const prices = data.Data as PriceEntry[]

		let near = prices[0]

		for (const price of prices) {
			if (Math.abs(price.time - time) < Math.abs(near.time - time)) {
				near = price
			}
		}

		return near
	}

	async syncHistoricalPrice(interval: 'hour' | 'minute'): Promise<void> {
		const now = Math.floor(Date.now() / 1000)


		if (interval === 'minute') {
			const sevenDaysPrior = now - (60 * 60 * 24 * 7)

			let last = now
			const batch: PriceEntry[] = []

			while (last >= sevenDaysPrior) {
				const {Response: response, Data: data, Message: message} = await this.request({
					hostname: 'min-api.cryptocompare.com',
					port: null,
					method: 'GET',
					path: `/data/v2/histominute?fsym=${this.coin}&tsym=${this.currency}&toTs=${last}&limit=2000`,
					headers: {
						'Content-Length': '0'
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
						return new Error(`not 1 minute apart: ${price.time} - ${data.Data[i - 1].time}`)
					}
				})
				batch.push(...data.Data)
				last = data.TimeFrom
			}
			
			const ndjson = batch.flat().map((e: PriceEntry) => JSON.stringify(e)).join('\n')
			
			if (process.env.UPLOAD) {
				await upload({
					bucket: 'casimir-price-dev',
					key: `${this.coin.toLowerCase()}_${this.currency.toLowerCase()}_minute.ndjson`,
					data: ndjson
				}).finally(() => {
					console.log('saved to s3')
				})
			}
			return
		}

		if (interval === 'hour') {
			const genesis = Math.floor(new Date(1438269973 * 1000).getTime() / 1000)

			let hlast = now

			const batch: PriceEntry[] = []

			while (hlast > genesis) {
				const {Response: response, Data: data, Message: message} = await this.request({
					hostname: 'min-api.cryptocompare.com',
					port: null,
					method: 'GET',
					path: `/data/v2/histohour?fsym=${this.coin}&tsym=${this.currency}&toTs=${hlast}&limit=2000`,
					headers: {
						'Content-Length': '0'
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

					if (price.time - data.Data[i - 1].time !== 60 * 60) {
						return new Error(`not 1 hour apart: ${price.time} - ${data.Data[i - 1].time}`)
					}
				})
				batch.push(...data.Data)
				hlast = data.TimeFrom
			}

			const ndjson = batch.flat().map((e: PriceEntry) => JSON.stringify(e)).join('\n')

			if (process.env.UPLOAD) {
				await upload({
					bucket: 'casimir-price-dev',
					key: `${this.coin.toLowerCase()}_${this.currency.toLowerCase()}_hour.ndjson`,
					data: ndjson
				}).finally(() => {
					console.log('saved to s3')
				})
			}
			return
		}
		throw new Error('invalid interval')
	}
}

async function run() {
	const exchange = new Exchange()
	await Promise.all([
		exchange.syncHistoricalPrice('minute'),
		exchange.syncHistoricalPrice('hour')
	]).finally(() => {
		console.log('done')
	}).catch((e) => {
		console.error(e)
	})
}

run()