import path from 'path'
import process from 'process'
import { EventTableSchema } from '@casimir/data'
import { queryAthena } from '@casimir/helpers'
import Piscina from 'piscina'

enum Provider {
    Alchemy = 'alchemy',
}

enum Network {
    Mainnet = 'mainnet',
    Testnet = 'testnet',
}

type EthereumTransfersOptions = {
    network: Network
    provider: Provider
    verbose?: boolean
}

class EthereumTransfers {
    chain: 'ethereum'
    network: Network
    provider: Provider
    pool: Piscina

    start: number
    end: number
    current: number
    last: number
    verbose: boolean
    constructor(opt: EthereumTransfersOptions) {
        this.chain = 'ethereum'
        this.provider = opt.provider
        this.network = opt.network
        this.start = 0
        this.end = 0
        this.current = 0
        this.last = 0
        this.verbose = opt.verbose || false
        this.pool = new Piscina({
            filename: path.resolve(__dirname, 'worker.mjs')
        })
    }

    private log(msg: any): void {
        if (this.verbose) {
            console.log(msg)
        }
    }

    async run(): Promise<void> {
        this.start = 15_500_000
        this.end = 16_000_000
        const interval = 500

        const last = await this.getLastProcessedEvent()

        if (last !== null) {
            this.start = parseInt(last.height.toString()) + 1
        } else  {
            this.start = 0
        }

        this.log(`crawling from ${this.start} to ${this.current} with interval ${interval}`)

        const begin = process.hrtime()
        
        const jobs: Array<Promise<void>> = []

        for (let i = this.start; i < this.end; i += interval) {
            jobs.push(this.pool.run({
                chain: 'ethereum',
                network: this.network,
                provider: this.provider,
                url: process.env.PUBLIC_ETHEREUM_URL || 'http://localhost:8545',
                start: i,
                end: i + interval,
            }))
        }

        console.log(`launching ${jobs.length} jobs using ${this.pool.threads.length} threads / pid: ${process.pid}`)
        
        await Promise.all(jobs).finally(() => {
            const end = process.hrtime(begin)
            this.log(`finished crawling from ${this.start} to ${this.current} in ${end[0]}s ${end[1] / 1000000}ms`)
        }).catch((err) => {
            console.error(err)
        })
    }
    async getLastProcessedEvent(): Promise<EventTableSchema | null> {
        const event = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.chain}' ORDER BY height DESC limit 1`)

        if (event === null) return null

        this.log(`last processed block: ${JSON.stringify(parseInt(event[0].height.toString()), null, 2)}`)
        return event[0]
    }
}

if (process.argv[0].endsWith('ts-node')) {
    runDev().catch((err) => {
        console.error(err)
        process.exit(1)
    })
}

async function runDev() {
    const service = new EthereumTransfers({
        network: Network.Mainnet || process.env.NETWORK,
        provider: Provider.Alchemy,
    })
    await service.run()
}