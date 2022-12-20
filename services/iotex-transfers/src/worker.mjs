// import { EthereumService } from './providers/Ethereum'
import process from 'process'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { Antenna } from 'iotex-antenna'

const actionTypes = {
    grantReward: 'grantReward',
    claimFromRewardingFund: 'claimFromRewardingFund',
    depositToRewardingFund: 'depositToRewardingFund',
    candidateRegister: 'candidateRegister',
    candidateUpdate: 'candidateUpdate',
    stakeCreate: 'stakeCreate',
    stakeRestake: 'stakeRestake',
    stakeAddDeposit: 'stakeAddDeposit',
    transfer: 'transfer',
    stakeUnstake: 'stakeUnstake',
    stakeWithdraw: 'stakeWithdraw',
    execution: 'execution',
    putPollResult: 'putPollResult',
    stakeChangeCandidate: 'stakeChangeCandidate',
}

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

    const antenna = new Antenna(url, 4689, {
        // signer: 
        // timeout: opt.timeout,
        // apiToken: opt.apiToken
    })

    const blocks = await getBlocks.call(antenna, start, end - start)
    for (let i = 0; i < blocks.blkMetas.length; i++) {
        process.exit(0)
    }

    function deduceActionType(action) {
        const core = action.action.core
        if (core === undefined) return null

        const t = Object.keys(core)

        const type = t.filter(k => k !== undefined)[t.length - 2]
        return type
    }

    async function getBlockActions(index, count) {
        if (index < 0 || count < 0) {
            throw new Error('index and count must be greater than 0')
        }
        const actions = await this.provider.iotx.getActions({
            byIndex: {
                start: index,
                count: count
            }
        })

        return actions.actionInfo
    }

    async function getBlocks(start, count) {
        if (start < 0 || count < 0) {
            throw new Error('start and count must be greater than 0')
        }

        if (start === 0) {
            start = 1
        }

        if (count === 0) {
            count = 100
        }

        const blocks = await this.provider.iotx.getBlockMetas({ byIndex: { start: start, count: count } })
        return blocks
    }

//   async getEvents(height: number): Promise<{ hash: string, events: Partial<EventTableSchema>[]}> {
//     const events: Partial<EventTableSchema>[] = []

//     const block = await this.provider.iotx.getBlockMetas({ byIndex: { start: height, count: 1 }})

//     const blockMeta = block.blkMetas[0]

//     const blockEvent = {
//       block: blockMeta.hash,
//       // transaction: blockMeta.
//       chain: this.chain,
//       network: this.network,
//       provider: Provider.Alchemy,
//       type: Event.Block,
//       created_at: new Date(block.blkMetas[0].timestamp.seconds * 1000).toISOString().replace('T', ' ').replace('Z', ''),
//       address: blockMeta.producerAddress,
//       height: parseInt(blockMeta.height.toString()),
//       // to_address: '',
//       // validator: '',
//       // duration: 0,
//       // validator_list: [],
//       // amount: 0,
//       // auto_stake: false
//     }

//     const numOfActions = parseInt(block.blkMetas[0].numActions.toString())

//     if (numOfActions === 0) {
//       return {
//         hash: blockMeta.hash,
//         events: [blockEvent]
//       }
//     }

//     const actions = await this.getBlockActions(height, numOfActions)

//     const blockActions = actions.map((action) => {
//       const actionCore = action.action.core
//       if (actionCore === undefined) return

//       const actionType = this.deduceActionType(action)

//       if (actionType === null) return

//       const actionEvent: Partial<EventTableSchema> = {
//         chain: this.chain,
//         network: this.network,
//         provider: Provider.Alchemy,
//         type: actionType,
//         created_at: new Date(action.timestamp.seconds * 1000).toISOString().replace('T', ' ').replace('Z', ''),
//         address: blockMeta.producerAddress,
//         height: blockMeta.height,
//         to_address: '',
//         validator: '',
//         duration: 0,
//         validator_list: [],
//         amount: '0',
//         auto_stake: false,
//       }

//       if (actionType === IotexActionType.transfer && actionCore.transfer) {
//         actionEvent.amount = parseInt(actionCore.transfer.amount).toString()
//         actionEvent.to_address = actionCore.transfer.recipient
//         events.push(actionEvent as EventTableSchema)
//       }

//       if (actionType === IotexActionType.stakeCreate && actionCore.stakeCreate) {
//         actionEvent.amount = actionCore.stakeCreate.stakedAmount
//         actionEvent.validator = actionCore.stakeCreate.candidateName
//         actionEvent.auto_stake = actionCore.stakeCreate.autoStake
//         actionEvent.duration = actionCore.stakeCreate.stakedDuration
//         events.push(actionEvent as EventTableSchema)
//       }

//       if (actionType === IotexActionType.stakeAddDeposit && actionCore.stakeAddDeposit) {
//         actionEvent.amount = actionCore.stakeAddDeposit.amount
//         events.push(actionEvent as EventTableSchema)
//       }

//       if (actionType === IotexActionType.execution && actionCore.execution) {
//         actionEvent.amount = actionCore.execution.amount
//         events.push(actionEvent as EventTableSchema)
//       }

//       if (actionType === IotexActionType.putPollResult && actionCore.putPollResult) {
//         if (actionCore.putPollResult.candidates) {
//           actionEvent.validator_list = actionCore.putPollResult.candidates.candidates.map(c => c.address)
//         }

//         if (actionCore.putPollResult.height) {
//           actionEvent.height = typeof actionCore.putPollResult.height === 'string' ? parseInt(actionCore.putPollResult.height) : actionCore.putPollResult.height
//         }
//         events.push(actionEvent as EventTableSchema)
//       }

//       if (actionType === IotexActionType.StakeChangeCandidate && actionCore.stakeChangeCandidate) {
//         actionEvent.validator = actionCore.stakeChangeCandidate.candidateName
//         events.push(actionEvent as EventTableSchema)
//       }

//       if (actionType === IotexActionType.stakeRestake && actionCore.stakeRestake) {
//         actionEvent.duration = actionCore.stakeRestake.stakedDuration
//         actionEvent.auto_stake = actionCore.stakeRestake.autoStake
//         events.push(actionEvent as EventTableSchema)
//         }

//       if (actionType === IotexActionType.candidateRegister && actionCore.candidateRegister) {
//         actionEvent.amount = actionCore.candidateRegister.stakedAmount
//         actionEvent.duration = actionCore.candidateRegister.stakedDuration
//         actionEvent.auto_stake = actionCore.candidateRegister.autoStake
//         actionEvent.validator = actionCore.candidateRegister.candidate.name
//         events.push(actionEvent as EventTableSchema)
//       }

//         if (actionType === IotexActionType.candidateUpdate && actionCore.candidateUpdate) {
//           actionEvent.validator = actionCore.candidateUpdate.name
//           events.push(actionEvent as EventTableSchema)
//         }

//         if (actionType === IotexActionType.claimFromRewardingFund && actionCore.claimFromRewardingFund) {
//           actionEvent.amount = actionCore.claimFromRewardingFund.amount
//         }

//         if (actionType === IotexActionType.depositToRewardingFund && actionCore.depositToRewardingFund) {
//           actionEvent.amount = actionCore.depositToRewardingFund.amount
//           events.push(actionEvent as EventTableSchema)
//         }

//         // if (actionType === IotexActionType.grantReward) {}
//         // if (actionType === IotexActionType.stakeUnstake) {}
//         // if (actionType === IotexActionType.stakeWithdraw) {}
//         return actionEvent
//       })

//     events.push(...blockActions as EventTableSchema[])

//     return {
//       hash: blockMeta.hash,
//       events
//     }
//   }
// }