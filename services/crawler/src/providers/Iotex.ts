import Antenna from 'iotex-antenna'
import { ClientReadableStream, IActionInfo, IGetBlockMetasResponse, IGetChainMetaResponse, IGetReceiptByActionResponse, IGetServerMetaResponse, IStreamBlocksResponse } from 'iotex-antenna/lib/rpc-method/types'
import { from } from '@iotexproject/iotex-address-ts'
import { Opts } from 'iotex-antenna/lib/antenna'
const IOTEX_CORE = "http://localhost:14014"

export type IotexOptions = Opts & {
  provider: string,
  chainId: 1 | 2
}

export enum IotexNetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet'
}

export interface IotexBlock {
  type: string
  id: string
  height: number
  datestring: string
  producer: string
  amount: string
  transaction_root: string
  num_of_actions: number
}

export interface EventTableColumns {
  type: string
  datestring: string
  address: string
  staked_candidate: string
  staked_amount: number
  staked_duration: number
  auto_stake: boolean
}

enum IotexActionType {
  transfer = 'transfer',
  grantReward = 'grant_reward',
  createStake = 'create_stake',
  stakeAddDeposit = 'stake_add_deposit',
  execution = 'execution',
  putPollResult = 'put_poll_result',
  stakeWithdraw = 'stake_withdraw',
  StakeChangeCandidate = 'stake_change_candidate',
  stakeRestake = 'stake_restake',
}

export class Iotex {
  provider: string
  chainId: number
  client: Antenna
  constructor (opt: IotexOptions) {
    this.provider = opt.provider || IOTEX_CORE
    this.chainId = opt.chainId
    this.client = new Antenna(opt.provider, opt.chainId, {
      signer: opt.signer,
      timeout: opt.timeout,
      apiToken: opt.apiToken
    })
  }

  async getChainMetadata (): Promise<IGetChainMetaResponse> {
    const meta = await this.client.iotx.getChainMeta({})
    return meta
  }

  async getServerMetadata (): Promise<IGetServerMetaResponse> {
    const meta = await this.client.iotx.getServerMeta({})
    return meta
  }

  async getBlockMetasByIndex (start: number, count: number): Promise<IotexBlock[]> {
    if (start < 0 || count < 0) {
      throw new Error('start and count must be greater than 0')
    }

    if (start === 0) {
      start = 1
    }

    if (count === 0) {
      count = 100
    }

    const { blkMetas } = await this.client.iotx.getBlockMetas({ byIndex: { start: start, count: count } })

    const meta = blkMetas.map(b => {
      return {
        type: 'block',
        id: b.hash,
        height: b.height,
        datestring: new Date(b.timestamp.seconds * 1000).toISOString(),
        producer: b.producerAddress,
        amount: b.transferAmount,
        transaction_root: b.txRoot,
        num_of_actions: b.numActions
      }
    })
    return meta
  }

  async getBlockMetaByHash (hash: string): Promise<IGetBlockMetasResponse> {
    const metas = await this.client.iotx.getBlockMetas({
      byHash: {
        blkHash: hash
      }
    })
    return metas
  }

  convertEthToIotx (eth: string): string {
    const add = from(eth)
    return add.string()
  }

  convertIotxToEth (iotx: string): string {
    const add = from(iotx)
    return add.stringEth()
  }

  async getAccountActions (address: string, count: number): Promise<any> {
    const account = await this.client.iotx.getAccount({
      address
    })

    if (account.accountMeta === undefined) {
      return []
    }

    const actions = await this.client.iotx.getActions({
      byAddr: {
        address: account.accountMeta.address,
        start: 1,
        count: count || 100
      }
    })

    return actions
  }

  async readableBlockStream (): Promise<ClientReadableStream<IStreamBlocksResponse>> {
    const stream = await this.client.iotx.streamBlocks({
      start: 1
    })
    return stream
  }

  async getTxReceipt (actionHash: string): Promise<IGetReceiptByActionResponse> {
    const tx = await this.client.iotx.getReceiptByAction({ actionHash })
    return tx
  }

  // Gets iotex actions by block heigh
  async getActionsByIndex (index: number, count: number): Promise<any> {
    const actions = await this.client.iotx.getActions({
      byIndex: {
        start: index,
        count: count
      }
    })
    const s = actions.actionInfo.map((action: IActionInfo) => {
      const core = action.action.core
      if (core === undefined) return
      const type = Object.keys(core).filter(k => k !== undefined)[Object.keys(core).length - 2]
      return this.convertToGlueSchema(type, action)
    })
    return s
  }

  // Depending on the action type it transforms the object according to the Glue schemas
  private convertToGlueSchema(type: string, action: IActionInfo): any {
    const core= action.action.core

    if (core === undefined) return
    switch (type) {
      case 'grantReward':
          return {
              type: IotexActionType.grantReward,
              date: new Date(action.timestamp.seconds * 1000).toISOString(),
              block_hash: action.blkHash,
              reward_type: core.grantReward?.type ?? '', 
          }
          case 'transfer':
          return {
              type: IotexActionType.transfer,
              date: new Date(action.timestamp.seconds * 1000).toISOString(),
              payload: typeof core.transfer?.payload === 'string' ? core.transfer.payload : core.transfer !== undefined ? Buffer.from(core.transfer.payload).toString('hex') : '',
              recipient: core.transfer?.recipient,
              amount: core.transfer?.amount ?? '',
          }
      case "stakeCreate":
          return {
              type: IotexActionType.createStake,
              date: new Date(action.timestamp.seconds * 1000).toISOString(),
              staked_candidate: core?.stakeCreate?.candidateName,
              staked_amount: core.stakeCreate?.stakedAmount,
              staked_duration: core.stakeCreate?.stakedDuration,
              auto_stake: core.stakeCreate?.autoStake,
          }
      case "stakeAddDeposit":
          return {
            type: IotexActionType.stakeAddDeposit,
            date: new Date(action.timestamp.seconds * 1000).toISOString(),
            amount: core.stakeAddDeposit?.amount,
            payload: core.stakeAddDeposit?.payload !== undefined ? Buffer.from(core.stakeAddDeposit?.payload).toString('hex') : '',
            bucket_index: core.stakeAddDeposit?.bucketIndex
          }
      case "execution":
          return {
            type: IotexActionType.execution,
            date: new Date(action.timestamp.seconds * 1000).toISOString(),
            contract: core.execution?.contract,
            amount: core.execution?.amount,
            data: core.execution?.data !== undefined ? Buffer.from(core.execution.data).toString("hex") : '',
          }
          case "putPollResult":
          return {
            type: IotexActionType.putPollResult,
            date: new Date(action.timestamp.seconds * 1000).toISOString(),
            candidates: core.putPollResult?.candidates?.candidates.map(c => c.address) ?? [],
          }
      case "stakeWithdraw":
          return {
            type: IotexActionType.stakeWithdraw,
            date: new Date(action.timestamp.seconds * 1000).toISOString(),
            bucket_index: core.stakeWithdraw?.bucketIndex,
            payload: core.stakeWithdraw?.payload !== undefined ? Buffer.from(core.stakeWithdraw.payload).toString('hex') : '',
          }
      case "stakeChangeCandidate":
          return {
            type: IotexActionType.StakeChangeCandidate,
            date: new Date(action.timestamp.seconds * 1000).toISOString(),
            candidate: core.stakeChangeCandidate?.candidateName,
            bucket_index: core.stakeChangeCandidate?.bucketIndex,
            payload: core.stakeChangeCandidate?.payload !== undefined ? Buffer.from(core.stakeChangeCandidate.payload).toString('hex') : '',
          }
      case "stakeRestake":
          return {
            type: IotexActionType.stakeRestake,
            date: new Date(action.timestamp.seconds * 1000).toISOString(),
            payload: core.stakeRestake?.payload !== undefined ? Buffer.from(core.stakeRestake.payload).toString('hex') : '',
            auto_stake: core.stakeRestake?.autoStake,
            staked_duration:core.stakeRestake?.stakedDuration,
            bucket_index: core.stakeRestake?.bucketIndex
          }
          default:
            console.log(type)
    }
  }
}

export async function newIotexService (opt?: IotexOptions): Promise<Iotex> {
  return new Iotex({
    provider: opt?.provider ?? 'https://api.iotex.one:443',
    chainId: opt?.chainId ?? 1
  })
}