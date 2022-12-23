import path from 'path'
import process from 'process'
import { EventTableSchema } from '@casimir/data'
import { queryAthena } from '@casimir/helpers'
import Piscina from 'piscina'
import ethers from 'ethers'

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

    async lastEvent(): Promise<number | null> {
        const rows = await queryAthena(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.chain}' ORDER BY height DESC limit 1`)
         if (rows === null) return null
         if (rows[0].height) {
            return rows[0].height
         }
         return null
     }

    async curretEvent(): Promise<number | null> {
        const service = new ethers.providers.JsonRpcProvider({
            url: process.env.PUBLIC_ETHEREUM_URL || 'http://localhost:8545',
        })

        const block = await service.getBlockNumber()
        return block
    }

    async run(): Promise<void> {

        const current = await this.curretEvent()
        const last = await this.lastEvent()

        if (last === null || current === null) {
            throw new Error('last or current block is null')
        } else {
            this.start = last + 1
            this.current = current
        }

        console.log(`starting from ${this.start} to ${this.end}`)
        const begin = process.hrtime()

        const jobs = Array<Promise<void>>()

        for (let i = 0; i < this.end; i += 1000) {
            const start = i === 0 ? this.start : this.start + 1
            const end = i + 1000
            jobs.push(this.pool.run({
                start,
                end,
                chain: this.chain,
                network: this.network,
                provider: this.provider,
            }))
        }

        await Promise.all(jobs).finally(() => {
            const end = process.hrtime(begin)
            this.log(`finished crawling from ${this.start} to ${this.current} in ${end[0]}s ${end[1] / 1000000}ms`)
        }).catch((err) => {
            console.error(err)
        })
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
