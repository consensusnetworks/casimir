import {Chain, eventOutputBucket, IpcMessage, Network} from './index'
import {EthereumService} from './providers/Ethereum'
import {uploadToS3} from '@casimir/helpers'
import {IotexService} from './providers/Iotex'
import {IStreamBlocksResponse} from 'iotex-antenna/lib/rpc-method/types'
import { Exchange } from './Exchange'


const buff: Array<number> = []
const exchangeRate = new Exchange()


async function handler(msg: IpcMessage): Promise<void> {
	switch (msg.action) {
		// case 'push':
			// await push()
			// break
		case 'stream':
			await stream(msg)
			break
		case 'subscribe':
			await subscribe(msg)
			break
		default:
			break
	}
}

async function push(msg: IpcMessage): Promise<void> {
	if (buff.length === 0) throw new Error('Blocks buffer is empty, make sure the `subscribe` action is sent before')

	if (msg.options.chain === Chain.Ethereum) {
		const service = new EthereumService({url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545'})

		for (const b of buff) {
			const event = await service.getEvents(b)

			if (process.env.UPLOAD === 'enabled') {
				await uploadToS3({
					bucket: eventOutputBucket,
					key: `${b}-events.json`,
					data: JSON.stringify(event)
				}).finally(() => {
					if (msg.options.verbose) {
						console.log(`uploaded ${b}-events.json`)
					}
				})
			}

			if (msg.options.verbose) {
				console.log('block: ', b)
			}
		}
	}
}

// Subscribes to the block stream and keeps the block height in the buffer to be processed laster as events
async function subscribe(msg: IpcMessage) {
	if (msg.options.chain === Chain.Ethereum) {
		const service = new EthereumService({url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545'})
		service.provider.on('block', async (b: number) => {
			if (msg.options.verbose) {
				console.log(`buffering block: ${b}, size: ${buff.length + 1}`)
			}
			const block = await service.getBlock(b)
			const price = await exchangeRate.getPriceAtTime(block.timestamp)

			console.log(price)
			buff.push(b)
		})
	}

	if (msg.options.chain === Chain.Iotex) {
		const service = new IotexService({ url: msg.options.serviceOptions?.url || 'https://api.iotex.one:443', network: Network.Mainnet })

		service.on('block', async (b: IStreamBlocksResponse) => {
			const header = b?.block?.block?.header?.core

			if (header) {
				if (msg.options.verbose) {
					console.log(`buffering block: ${header.height}, size: ${buff.length + 1}`)
				}
				// add commas to the number for pretty printing
				buff.push(header.height)
			}
		})
	}
}

// Stream also subscribes to the stream but does not keep track of the block it directly processes the block
async function stream(msg: IpcMessage): Promise<void> {
	if (msg.options.verbose) {
		console.log('back to streaming')
	}

	if (msg.options.chain === Chain.Ethereum) {
		const service = new EthereumService({url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545'})

		service.provider.on('block', async (b: number) => {
			const event = await service.getEvents(b)

			if (process.env.UPLOAD === 'enabled') {

				await uploadToS3({
					bucket: eventOutputBucket,
					key: `block-${b}-events.json`,
					data: JSON.stringify(event)
				}).finally(() => {
					if (msg.options.verbose) {
						console.log(`uploaded ${b}-events.json`)
					}
				})
			}

			if (msg.options.verbose) {
				console.log('block: ', b)
			}
		})
	}
	return
}

process.on('message', handler)
