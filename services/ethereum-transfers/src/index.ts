import path from 'path'
import process from 'process'
import { EventTableSchema } from '@casimir/data'
import { queryAthena, upload } from '@casimir/helpers'
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
    head: number
    last: number
    verbose: boolean
    status: 'idle' | 'running' | 'stopped'
    startedAt: string
    endedAt: string | null
    constructor(opt: EthereumTransfersOptions) {
        this.chain = 'ethereum'
        this.provider = opt.provider
        this.network = opt.network
        this.start = 0
        this.end = 0
        this.current = 0
        this.head = 0
        this.last = 0
        this.verbose = opt.verbose || false
        this.pool = new Piscina({
            filename: path.resolve(__dirname, 'worker.mjs')
        })
        this.status = 'idle'
        this.startedAt = new Date().toISOString()
        this.endedAt = null
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

    async chainHead(): Promise<number | null> {
        console.log(ethers)
        const service = new ethers.providers.JsonRpcProvider({
            url: process.env.PUBLIC_ETHEREUM_URL || 'http://localhost:8545',
        })

        const block = await service.getBlockNumber()
        return block
    }

    async takeSnapshot() {
        const tt = this.startedAt.split('T')[1].split('.')[0].replace(/:/g, '-')
        const key = this.startedAt.split('T')[0].replace(/-/g, '/') + '/' + tt + '.json'

        const meta = {
            start: this.start,
            end: this.end,
            head: this.head,
            current: this.current,
            provider: this.provider,
            network: this.network,
            chain: this.chain,
            started_at: this.startedAt.replace('T', ' ').replace('Z', ''),
            ended_at: this.endedAt,
        }
        
        await upload({
            bucket: 'casimir-crawler-log-dev',
            key,
            data: JSON.stringify(meta),
        }).catch((err) => {
            console.log(err)
        })
        return meta
    }


    async run(): Promise<void> {
        this.status = 'running'

        this.start = 0
        this.end = 15_000_000

        const head = await this.chainHead()

        if (head === null) {
            throw new Error('Unable to get chain head')
        }

        this.head = head

        console.log(this)

        // const snap = await this.takeSnapshot()

    //     const last = await this.lastEvent()

    //     if (last === null) {
    //         throw new Error('last block is null')
    //     } else {
    //         this.start = parseInt(last.toString()) + 1
    //     }

    //     console.log(`starting from ${this.start} to ${this.end}`)
    //     const begin = process.hrtime()

    //     const jobs = Array<Promise<void>>()

    //     const interval = 1000

    //     let iter = 0
        
    //     for (let i = this.start; i < this.end; i += interval) {
    //         const start = iter === 0 ? i : i + 1
    //         const end = i + interval

    //         jobs.push(this.pool.run({
    //             start,
    //             end,
    //             chain: this.chain,
    //             network: this.network,
    //             provider: this.provider,
    //             url: process.env.PUBLIC_ETHEREUM_URL || 'http://localhost:8545',
    //         }))
    //         iter++
    //     }

    //     await Promise.all(jobs).finally(() => {
    //         const end = process.hrtime(begin)
    //         this.log(`finished crawling from ${this.start} to ${this.current} in ${end[0]}s ${end[1] / 1000000}ms`)
    //     }).catch((err) => {
    //         console.error(err)
    //     })
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
