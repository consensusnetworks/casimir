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
			console.log('default')
	}
}

async function stream(msg: IpcMessage): Promise<void> {
	if (msg.options.chain === 'ethereum') {
		const service = new EthereumService({ url: msg.options.serviceOptions?.url ||  process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545' })

		service.provider.on('block', async (b: number) => {
			if (b <= msg._start) {
				return
			}

			const block = await service.getBlock(b)
			const event = service.toEvent(block)
			const ndjson = JSON.stringify(event)

			console.log(`--- STREAM --- \n ${ndjson} \n STREAM ---`)

			if (process.env.UPLOAD === 'enabled') {
				await uploadToS3({
					bucket: eventOutputBucket,
					key: `${block}-events.json`,
					data: ndjson
				}).finally(() => {
					if (msg.options.verbose) {
						console.log(`uploaded ${block.number}-events.json from stream`)
					}
				})
				console.log(ndjson)
				return
			}

			if (msg.options.verbose) {
				console.log(`--- FROM STREAM --- \n ${ndjson} \n FROM STREAM ---`)
			}
		})
	}
}
