import { IStreamBlocksResponse } from 'iotex-antenna/lib/rpc-method/types'
import { Opts } from 'iotex-antenna/lib/antenna'
import { EventTableColumn } from '@casimir/data'
import { BaseService, Chain } from './Base'
import { queryAthena } from '@casimir/helpers'
import { ethers } from 'ethers'

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

export type IotexOptions = Opts & {
  network: IotexNetworkType
}

export class IotexService implements BaseService {
  chain: Chain
  network: IotexNetworkType
  provider: ethers.providers.JsonRpcProvider

  private readonly chainId: string
  // todo: switch to ether and point to iotex rpc
  constructor (opt: IotexOptions) {
    this.chain = Chain.Iotex
    this.network = opt.network || IotexNetworkType.Mainnet
    this.chainId = IotexNetworkType.Mainnet
    this.provider = new ethers.providers.JsonRpcProvider({
        url: this.network === IotexNetworkType.Mainnet ? 'https://babel-api.mainnet.iotex.io' : 'https://babel-api.testnet.iotex.io',
    })
  }

  async getChainMetadata (): Promise<any> {
    return await this.provider.getNetwork()
  }

  async getBlock(num: number): Promise<ethers.providers.Block> {
    return await this.provider.getBlock(num)
  }

  async getBlockWithTransactions(b: any): Promise<any> {
    const block = await this.getBlock(b)

    if (block.transactions.length !== 0) {
      for (const tx of block.transactions) {
        const receipt = await this.getTransaction(tx)
        block.transactions.push(receipt)
      }
    }
    return block
  }

  async getLastProcessedEvent(): Promise<EventTableColumn | null> {
    const event = await queryAthena(`SELECT height FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${Chain.Iotex}' ORDER BY height DESC limit 1`)

    if (event !== null && event.length === 1) {
      return event[0]
    }
    return null
  }

  async getTransaction(actionHash: string): Promise<any> {
    return await this.provider.getTransaction(actionHash)
  }

  async getCurrentBlock(): Promise<ethers.providers.Block> {
    const height = await this.provider.getBlockNumber()
    return await this.provider.getBlock(height)
  }

  // convertToGlueSchema(obj: { type: string, block: ethers.providers.Block, tx: any}): EventTableColumn {
  //   const core = obj.action.action.core
  //
  //   if (core === undefined) throw new Error('core is undefined')
  //
  //   const event: EventTableColumn = {
  //     chain: Chain.Iotex,
  //     network: IotexNetworkType.Mainnet,
  //     provider: 'casimir',
  //     created_at: new Date(obj.block.timestamp.seconds * 1000).toISOString(),
  //     type: obj.type,
  //     address: obj.block.producerAddress,
  //     height: obj.block.height,
  //     to_address: '',
  //     candidate: '',
  //     candidate_list: [],
  //     amount: '0',
  //     duration:  0,
  //     auto_stake: false,
  //   }
  //   switch (obj.type) {
  //     case 'grantReward':
  //       event.type = IotexActionType.grantReward
  //       return event
  //     case 'transfer':
  //       event.type = IotexActionType.transfer
  //
  //       if (core.transfer?.amount !== undefined) {
  //         event.amount = core.transfer?.amount
  //       }
  //       return event
  //     case 'stakeCreate':
  //       if (core.stakeCreate?.autoStake !== undefined) {
  //         event.auto_stake = core.stakeCreate.autoStake
  //       }
  //     event.type = IotexActionType.createStake
  //     return event
  //     case 'stakeAddDeposit':
  //       event.type = IotexActionType.stakeAddDeposit
  //       if (core.stakeAddDeposit?.amount !== undefined) {
  //         event.amount = core.stakeAddDeposit?.amount
  //       }
  //       return event
  //     case 'execution':
  //       event.type = IotexActionType.execution
  //       if (core.execution?.amount !== undefined) {
  //         event.amount = core.execution?.amount
  //       }
  //       return event
  //       case 'putPollResult':
  //       event.type =  IotexActionType.putPollResult
  //       if (core.putPollResult?.candidates !== undefined) {
  //         event.candidate_list = core.putPollResult?.candidates.candidates.map(c => c.address)
  //       }
  //         return event
  //     case 'stakeWithdraw':
  //       event.type = IotexActionType.grantReward
  //       return event
  //     case 'stakeChangeCandidate':
  //       event.type = IotexActionType.StakeChangeCandidate
  //       return event
  //     case 'stakeRestake':
  //       event.type = IotexActionType.grantReward
  //       if (core.stakeRestake?.autoStake !== undefined) {
  //         event.auto_stake = core.stakeRestake.autoStake
  //       }
  //       if (core.stakeRestake?.stakedDuration !== undefined) {
  //         event.duration = core.stakeRestake.stakedDuration
  //       }
  //       return event
  //     default:
  //       throw new Error(`Action type ${obj.type} not supported`)
  //   }
  // }

  on(event:string, cb: (block: IStreamBlocksResponse) => void): void {

  }
}

export function newIotexService (opt: IotexOptions): IotexService {
  return new IotexService(opt)
}