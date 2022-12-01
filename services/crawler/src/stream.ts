import {eventOutputBucket, IpcMessage} from './index'
import { EthereumService } from './providers/Ethereum'
import { uploadToS3 } from '@casimir/aws-helpers'

const buff: Array<number> = []

async function processIpc(msg: IpcMessage): Promise<void> {
	switch (msg.action) {
		case 'stream':
			await stream('stream', msg)
			break
		case 'subscribe':
			await stream('subscribe', msg)
			break
		case 'pull_blocks':
			if (buff.length === 0) throw new Error('Buffer of streamed blocks is empty')
				if (process.send) {
					if (msg.options.verbose) {
						console.log(`sending ${buff.length} blocks to parent process`)
					}
					process.send({
						action: 'push_blocks',
						blocks: buff
					})
				}
			break
		default:
			break
	}
}

async function stream(event: 'stream' | 'subscribe', msg: IpcMessage): Promise<void> {
	if (event === 'stream') {

		if (msg.options.verbose) {
			console.log('back to streaming')
		}

		if (msg.options.chain === 'ethereum') {
			const service = new EthereumService({url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545'})

			service.provider.on('block', async (b: number) => {
				const block = await service.getBlock(b)
				const event = await service.toEvent(block)

				if (process.env.UPLOAD === 'enabled') {
					await uploadToS3({
						bucket: eventOutputBucket,
						key: `${block}-events.json`,
						data: JSON.stringify(event)
					}).finally(() => {
						if (msg.options.verbose) {
							console.log(`uploaded ${block}-events.json`)
						}
					})
				}
				if (msg.options.verbose) {
					console.log(`from stream: ${block.number}`)
				}
			})
		}
		return
	}

	if (event === 'subscribe') {
		if (msg.options.chain === 'ethereum') {
			const service = new EthereumService({url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545'})

			service.provider.on('block', async (b: number) => {
				buff.push(b)
			})
		}
	}
}
process.on('message', processIpc)
