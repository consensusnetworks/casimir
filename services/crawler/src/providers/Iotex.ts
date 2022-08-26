import Antenna from 'iotex-antenna'
import {
  ClientReadableStream,
  IActionInfo,
  IGetBlockMetasResponse,
  IBlockMeta,
  IGetChainMetaResponse,
  IGetReceiptByActionResponse,
  IGetServerMetaResponse,
  IStreamBlocksResponse,
  IBlock, IGetActionsResponse
} from 'iotex-antenna/lib/rpc-method/types'
import { from } from '@iotexproject/iotex-address-ts'
import { Opts } from 'iotex-antenna/lib/antenna'
import { eventSchema, EventTableColumn } from '@casimir/data'
import {Chain} from '../index'

const IOTEX_CORE = 'http://localhost:14014'

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

export class IotexService {
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

  async getBlocks(start: number, count: number): Promise<IGetBlockMetasResponse> {
    if (start < 0 || count < 0) {
      throw new Error('start and count must be greater than 0')
    }

    if (start === 0) {
      start = 1
    }

    if (count === 0) {
      count = 100
    }

    return await this.client.iotx.getBlockMetas({ byIndex: { start: start, count: count } })
  }

  async getBlockMeta (blockHash: string): Promise<IGetBlockMetasResponse> {
    const metas = await this.client.iotx.getBlockMetas({
      byHash: {
        blkHash: blockHash
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

  async getBlockActions (index: number, count: number): Promise<IActionInfo[]> {
    const actions = await this.client.iotx.getActions({
      byIndex: {
        start: index,
        count: count
      }
    })
    return actions.actionInfo
  }


  convertToGlueSchema(obj: { type: string, block: IBlockMeta, action: IActionInfo}): EventTableColumn {
    const core = obj.action.action.core

    if (core === undefined) throw new Error('core is undefined')

    const event: EventTableColumn = {
      chain: Chain.Iotex,
      network: this.chainId === 1 ? IotexNetworkType.Mainnet : IotexNetworkType.Testnet,
      provider: 'casimir',
      date: new Date(obj.block.timestamp.seconds * 1000).toISOString(),
      type: '',
      address: obj.block.producerAddress,
      to_address: '',
      candidate: '',
      candidate_list: [],
      amount: 0,
      duration:  0,
      auto: false,
      payload: {}
    }

    switch (obj.type) {
      case 'grantReward':
        event.type = IotexActionType.grantReward
        return event
      case 'transfer':
        event.type = IotexActionType.transfer

        if (core.transfer?.amount !== undefined) {
          event.amount = parseInt(core.transfer?.amount)
        }
        return event
      case 'stakeCreate':
        if (core.stakeCreate?.autoStake !== undefined) {
          event.auto = core.stakeCreate.autoStake
        }
      event.type = IotexActionType.createStake
      return event
      case 'stakeAddDeposit':
        event.type = IotexActionType.stakeAddDeposit
        if (core.stakeAddDeposit?.amount !== undefined) {
          event.amount = parseInt(core.stakeAddDeposit?.amount)
        }
        if (core.stakeAddDeposit?.payload !== undefined) {
          console.log(typeof core.stakeAddDeposit.payload)
        }
        return event
      case 'execution':
        event.type = IotexActionType.execution
        if (core.execution?.amount !== undefined) {
          event.amount = parseInt(core.execution?.amount)
        }
        return event
        case 'putPollResult':  
        event.type =  IotexActionType.putPollResult
        if (core.putPollResult?.candidates !== undefined) {
          event.candidate_list = core.putPollResult?.candidates.candidates.map(c => c.address)
        }
          return event
      case 'stakeWithdraw':
        event.type = IotexActionType.grantReward
        return event
      case 'stakeChangeCandidate':
        event.type = IotexActionType.StakeChangeCandidate
        return event
      case 'stakeRestake':
        event.type = IotexActionType.grantReward
        if (core.stakeRestake?.autoStake !== undefined) {
          event.auto = core.stakeRestake.autoStake
        }

        if (core.stakeRestake?.stakedDuration !== undefined) {
          event.duration = core.stakeRestake.stakedDuration
        }
        return event
      default:
        throw new Error(`Action type ${obj.type} not supported`)
    }
  }
}

export async function newIotexService (opt?: IotexOptions): Promise<IotexService> {
  return new IotexService({
    provider: opt?.provider ?? 'https://api.iotex.one:443',
    chainId: opt?.chainId ?? 1
  })
}