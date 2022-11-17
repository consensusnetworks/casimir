import { uploadToS3 } from '@casimir/helpers'
import {Chain, eventOutputBucket, IpcMessage, Network} from './index'
import {EthereumService} from './providers/Ethereum'
import {IotexService} from './providers/Iotex'
import {EventTableSchema} from '@casimir/data'

async function handler(msg: IpcMessage): Promise<void> {
    switch (msg.action) {
        case 'start':
            await start(msg)
            break
        default:
            break
    }
}

async function start(msg: IpcMessage): Promise<void> {
    if (msg.options.chain === Chain.Ethereum) {
        const service = new EthereumService({ url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545' })
        for (let i = msg.start; i <= msg.current; i++) {
            const { events } = await service.getEvents(i)
            const ndjson = events.map((e: any) => JSON.stringify(e)).join('\n')

            if (process.env.UPLOAD === 'enabled') {
                await uploadToS3({
                    bucket: eventOutputBucket,
                    key: `${events[0].height}-events.json`,
                    data: ndjson
                }).finally(() => {
                    console.log(`uploaded events for block ${events[0].height}`)
                })
            } else {
                console.log(`crawling block : ${events[0].height} - events: ${events.length}`)
            }
        }
        return
    }
    if (msg.options.chain === Chain.Iotex) {
        const service = new IotexService({ url: msg.options.serviceOptions?.url || 'https://api.iotex.one:443', network: Network.Mainnet })

        for (let i = msg.start; i < msg.current; i++) {
            const { events } = await service.getEvents(i)
            const ndjson = events.map((e: Partial<EventTableSchema>) => JSON.stringify(e)).join('\n')

            if (process.env.UPLOAD === 'enabled') {
                await uploadToS3({
                    bucket: eventOutputBucket,
                    key: `block-${events[0].height}-events.json`,
                    data: ndjson
                }).finally(() => {
                    if (msg.options.verbose) {
                        console.log(`uploaded ${events[0].height}-events.json`)
                    }
                })
            } else {
                console.log(`crawling block : ${events[0].height} - events: ${events.length}`)
            }
        }
        return
    }
}

process.on('message', handler)
