import { IpcMessage} from './index'
import { EthereumService } from './providers/Ethereum'
import { uploadToS3 } from '@casimir/helpers'

const buff: Array<number> = []

let round = 1

async function processIpc(msg: IpcMessage): Promise<void> {
	switch (msg.action) {
		case 'subscribe':
			await stream(msg)
			break
		case 'pull_blocks':
			if (buff.length === 0) throw new Error('Buffer of streamed blocks is empty')
				if (process.send) {
					if (msg.options.verbose) {
						console.log('pushing streamed blocks to parent process')
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


async function stream(msg: IpcMessage): Promise<void> {
	if (msg.options.chain === 'ethereum') {
		const service = new EthereumService({ url: msg.options.serviceOptions?.url ||  process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545' })

		service.provider.on('block', async (b: number) => {
			buff.push(b)
		})
		round += 1
	}
}

process.on('message', processIpc)
