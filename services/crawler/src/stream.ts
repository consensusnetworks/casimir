import {eventOutputBucket, IpcMessage} from './index'
import {EthereumService} from './providers/Ethereum'
import {uploadToS3} from '@casimir/helpers'

process.on('message', processIpc)

async function processIpc(msg: IpcMessage): Promise<void> {
	switch (msg.action) {
		case 'start':
			await stream(msg)
			break
		default:
			break
	}
}

async function stream(msg: IpcMessage): Promise<void> {
	if (msg.options.chain === 'ethereum') {
		const service = new EthereumService({ url: msg.options.serviceOptions?.url ||  process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545' })

		service.provider.on('block', async (b: number) => {
			const block = await service.getBlock(b)
			const event = service.toEvent(block)

			event.streamed = true

			const ndjson = JSON.stringify(event)

			if (process.env.UPLOAD === 'enabled') {
				await uploadToS3({
					bucket: eventOutputBucket,
					key: `${block}-events.json`,
					data: ndjson
				}).finally(() => {
					if (msg.options.verbose) {
						console.log(`uploaded block: ${block.number}`)
					}
				})
				return
			}

			if (msg.options.verbose) {
				console.log(`--- STREAM --- \n ${ndjson} \n STREAM ---`)
			}
		})
	}
}
