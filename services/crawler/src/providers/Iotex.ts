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
} from 'iotex-antenna/lib/rpc-method/types'
import { from } from '@iotexproject/iotex-address-ts'
import { Opts } from 'iotex-antenna/lib/antenna'
import { EventTableColumn } from '@casimir/data'
import {BaseService, Chain} from './Base'
import EventEmitter from 'events'
import {queryAthena} from '@casimir/helpers'
import {ethers} from 'ethers'

export enum IotexNetworkType {
  Mainnet = '4689',
  Testnet = '4690'
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

export type IotexOptions = Opts

export class IotexService implements BaseService {
  chain: Chain
  // provider: Antenna
  provider: ethers.providers.JsonRpcProvider
  eventEmitter: EventEmitter | null = null

  private readonly chainId: string
  // todo: switch to ether and point to iotex rpc
  constructor (opt: IotexOptions) {
    this.chain = Chain.Iotex
    this.provider = new ethers.providers.JsonRpcProvider({
        url: 'https://babel-api.mainnet.iotex.io',
    })
    // this.provider = new Antenna('https://iotexrpc.com', parseInt(IotexNetworkType.Mainnet), {
    //   signer: opt.signer,
    //   timeout: opt.timeout,
    //   apiToken: opt.apiToken
    // })
    this.eventEmitter = null
    this.chainId = IotexNetworkType.Mainnet
  }

  async getChainMetadata (): Promise<any> {
    // return await this.provider.getNetwork()
  }

  async getBlock(num: number): Promise<any> {
    return await this.provider.getBlock(num)
  }

  async getLastProcessedEvent(chain: Chain): Promise<EventTableColumn | null> {
    const event = await queryAthena(`SELECT height FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${Chain.Iotex}' ORDER BY height DESC limit 1`)

    if (event.length === 1) {
      return event[0]
    }

    console.log('More than one event found')
    return null
  }

  // Note: Transactions in ethereum are called actions in Iotex
  async getTransaction(tx: string): Promise<any> {
    return await this.provider.getTransaction(tx)
  }

  async getCurrentBlock(): Promise<number> {
    const current = await this.getChainMetadata()
    return parseInt(current.chainMeta.height)
  }

  convertToGlueSchema(obj: { type: string, block: IBlockMeta, action: IActionInfo}): EventTableColumn {
    const core = obj.action.action.core

    if (core === undefined) throw new Error('core is undefined')

    const event: EventTableColumn = {
      chain: Chain.Iotex,
      // 'https://api.iotex.one:443'
      network: IotexNetworkType.Mainnet,
      provider: 'casimir',
      created_at: new Date(obj.block.timestamp.seconds * 1000).toISOString(),
      type: '',
      address: obj.block.producerAddress,
      height: obj.block.height,
      to_address: '',
      candidate: '',
      candidate_list: [],
      amount: 0,
      duration:  0,
      auto_stake: false,
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
          event.auto_stake = core.stakeCreate.autoStake
        }
      event.type = IotexActionType.createStake
      return event
      case 'stakeAddDeposit':
        event.type = IotexActionType.stakeAddDeposit
        if (core.stakeAddDeposit?.amount !== undefined) {
          event.amount = parseInt(core.stakeAddDeposit?.amount)
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
          event.auto_stake = core.stakeRestake.autoStake
        }
        if (core.stakeRestake?.stakedDuration !== undefined) {
          event.duration = core.stakeRestake.stakedDuration
        }
        return event
      default:
        throw new Error(`Action type ${obj.type} not supported`)
    }
  }

  on(event:string, cb: (block: IStreamBlocksResponse) => void): void {
    // const stream = this.provider.iotx.streamBlocks({ start: 0 })
    //
    // stream.on('data', (block: IStreamBlocksResponse) => {
    //   cb(block)
    // })
    //
    // stream.on('error', (err: any) => {
    //   throw new Error(err)
    // })
  }

  async save(key: string, data: string): Promise<void> {
    return
  }

  // private async getBlocks(start: number, count: number): Promise<IGetBlockMetasResponse> {
  //   if (start < 0 || count < 0) {
  //     throw new Error('start and count must be greater than 0')
  //   }
  //
  //   if (start === 0) {
  //     start = 1
  //   }
  //
  //   if (count === 0) {
  //     count = 100
  //   }
  //
  //   return await this.provider.iotx.getBlockMetas({ byIndex: { start: start, count: count } })
  // }
}

export async function newIotexService (opt: IotexOptions): Promise<IotexService> {
  return new IotexService(opt)
}