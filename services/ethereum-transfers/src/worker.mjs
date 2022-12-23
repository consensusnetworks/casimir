// import { EthereumService } from './providers/Ethereum'
import process from 'process'
import ethers from 'ethers'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'

let s3 = new S3Client({
    region: 'us-east-2',
    credentials: defaultProvider(),
})

export async function upload({ bucket, key, data }) {
    if (!s3) {
        s3 = new S3Client({
            region: 'us-east-2',
            credentials: defaultProvider(),
        })
    }

    const upload = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
    })

    const { $metadata } = await s3.send(upload)
    if ($metadata.httpStatusCode !== 200) throw new Error('Error uploading to s3')
}

export default async ({ chain, network, provider, start, end, url }) => {
    if (!chain) {
        throw new Error('Missing chain')
    }

    if (!start) {
        throw new Error('Missing start block')
    }

    if (!end) {
        throw new Error('Missing end block')
    }

    if (!url) {
        throw new Error('Missing url')
    }

    console.log(`crawling ${chain} from ${start} to ${end}`)

    const service = new ethers.providers.JsonRpcProvider(url)

    for (let i = start; i <= end; i++) {

        const start = process.hrtime()

        let events = []

        const block = await service.getBlockWithTransactions(i)

        const fromAddressBalance = await service.getBalance(block.miner)

        const blockEvent = {
            chain: chain,
            network: network,
            provider: provider,
            type: 'block',
            height: block.number,
            block: block.hash,
            created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
            address: block.miner,
            gas_used: block.gasUsed.toString(),
            gas_limit: block.gasLimit.toString(),
            address_balance: ethers.utils.formatEther(fromAddressBalance.toString()),

            // amount: "",
            // auto_stake: false,
            // duration: 0,
            // to_address: "",
            // transaction: "",
            // validator: "",
            // validator_list: [],
        }

        if (block.baseFeePerGas) {
            blockEvent.base_fee = ethers.BigNumber.from(block.baseFeePerGas).toString()
            const burnt = ethers.BigNumber.from(block.gasUsed).mul(ethers.BigNumber.from(block.baseFeePerGas))
            blockEvent.burnt_fee = burnt.toString()
        }

        events.push(blockEvent)

        if (block.transactions.length === 0) {
            await upload({
                bucket: 'casimir-etl-event-bucket-dev',
                key: `${events[0].height}-events.json`,
                data: events.map((e) => JSON.stringify(e)).join('\n')
            }).finally(() => {
                const end = process.hrtime(start)
                console.log(`block: ${block.number} - tx: ${block.transactions.length} - time: ${end[0]}s ${Math.floor(end[1] / 1000000)}ms`)
            })
            continue
        }

        for (const t of block.transactions) {
            const txEvent = {
                chain: chain,
                network: 'mainnet',
                provider: 'alchemy',
                type: 'transaction',
                height: block.number,
                block: block.hash,
                transaction: t.hash,
                address: t.from,
                created_at: new Date(block.timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ''),
                amount: ethers.utils.formatEther(t.value.toString()),
                gas_used: block.gasUsed.toString(),
                address_balance: ethers.utils.formatEther(fromAddressBalance.toString()),

                // auto_stake: false,
                // baseFee: "",
                // burntFee: "",
                // duration: 0,
                // to_address: "",
                // validator: "",
                // validator_list: [],
            }

            if (t.to) {
                txEvent.to_address = t.to
                // const toAddressBalance = await service.getBalance(t.to)
                // txEvent.to_address_balance = ethers.utils.formatEther(toAddressBalance.toString())
            }

            if (t.gasLimit) {
                txEvent.gas_limit = t.gasLimit.toString()
            }

            if (t.gasPrice) {
                txEvent.gas_price = t.gasPrice.toString()
            }
            events.push(txEvent)
        }


        await upload({
            bucket: 'casimir-etl-event-bucket-dev',
            key: `${events[0].height}-events.json`,
            data: events.map((e) => JSON.stringify(e)).join('\n')
        }).finally(() => {
            const end = process.hrtime(start)
            console.log(`block: ${block.number} - tx: ${block.transactions.length} - time: ${end[0]}s ${Math.floor(end[1] / 1000000)}ms`)
        })
    }
    process.exit(0)
}
