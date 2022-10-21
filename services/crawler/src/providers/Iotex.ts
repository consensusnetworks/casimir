
import Antenna from 'iotex-antenna'
import {
  ClientReadableStream,
  IActionInfo,
  IGetBlockMetasResponse,
  IStreamBlocksResponse,
} from 'iotex-antenna/lib/rpc-method/types'
import { Opts } from 'iotex-antenna/lib/antenna'
import { EventTableSchema } from '@casimir/data'
import { Chain, Event, Provider, Network } from '../index'

export enum IotexNetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export enum IotexActionType {
  grantReward = 'grantReward',
  claimFromRewardingFund = 'claimFromRewardingFund',
  depositToRewardingFund = 'depositToRewardingFund',
  candidateRegister = 'candidateRegister',
  candidateUpdate = 'candidateUpdate',
  stakeCreate = 'stakeCreate',
  stakeRestake = 'stakeRestake',
  stakeAddDeposit = 'stakeAddDeposit',
  transfer = 'transfer',
  stakeUnstake = 'stakeUnstake',
  stakeWithdraw = 'stakeWithdraw',

  // non governance actions
  execution = 'execution',
  putPollResult = 'putPollResult',
  StakeChangeCandidate = 'stakeChangeCandidate',
}

export type IotexServiceOptions = Opts & {
  url: string
  network: IotexNetworkType
}

export class IotexService {
  chain: Chain
  network: IotexNetworkType
  provider: Antenna
  chainId: number
  constructor (opt: IotexServiceOptions) {
    this.chain = Chain.Iotex
    this.network = opt.network || IotexNetworkType.Mainnet
    this.chainId = IotexNetworkType.Mainnet ? 4689 : 4690
    this.provider = new Antenna(opt.url, this.chainId, {
      signer: opt.signer,
      timeout: opt.timeout,
      apiToken: opt.apiToken
    })
  }

  deduceActionType (action: IActionInfo): IotexActionType | null {
    const core = action.action.core
    if (core === undefined) return null

    const type = Object.keys(core).filter(k => k !== undefined)[Object.keys(core).length - 2]
    return type as IotexActionType
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

    const blocks = await this.provider.iotx.getBlockMetas({ byIndex: { start: start, count: count } })

    return blocks
  }

  async getBlockActions (index: number, count: number): Promise<IActionInfo[]> {
    const actions = await this.provider.iotx.getActions({
      byIndex: {
        start: index,
        count: count
      }
    })
    return actions.actionInfo
  }

  async getCurrentBlock(): Promise<IGetBlockMetasResponse> {
    const { chainMeta } = await this.provider.iotx.getChainMeta({
      includePendingActions: false
    })

    const block = await this.provider.iotx.getBlockMetas({ byIndex: { start: parseInt(chainMeta.height), count: 1 } })
    return block
  }

  async readableBlockStream (): Promise<ClientReadableStream<IStreamBlocksResponse>> {
    const stream = await this.provider.iotx.streamBlocks({
      start: 1,
    })
    return stream
  }

  on(event: string, callback: (data: IStreamBlocksResponse) => void): void {
    this.provider.iotx.streamBlocks({
      start: 1
    }).on('data', (data: IStreamBlocksResponse) => {
      callback(data)
    })
  }

  async getEvents(height: number): Promise<{ hash: string, events: Partial<EventTableSchema>[]}> {
    const events: Partial<EventTableSchema>[] = []

    const block = await this.provider.iotx.getBlockMetas({byIndex: {start: height, count: 1}})

    const blockMeta = block.blkMetas[0]

    const blockEvent = {
      block: blockMeta.hash,
      // transaction: "",
      chain: this.chain,
      network: this.network,
      provider: Provider.Alchemy,
      type: Event.Block,
      created_at: new Date(block.blkMetas[0].timestamp.seconds * 1000).toISOString().replace('T', ' ').replace('Z', ''),
      address: blockMeta.producerAddress,
      height: blockMeta.height,
      to_address: '',
      validator: '',
      duration: 0,
      validator_list: [],
      amount: 0,
      auto_stake: false
    }



    const numOfActions = block.blkMetas[0].numActions

    if (numOfActions > 0) {
      const actions = await this.getBlockActions(height, numOfActions)

      const blockActions = actions.map((action) => {
        const actionCore = action.action.core
        if (actionCore === undefined) return

        const actionType = this.deduceActionType(action)
        if (actionType === null) return

        const actionEvent: Partial<EventTableSchema> = {
          chain: this.chain,
          network: this.network,
          provider: Provider.Alchemy,
          type: actionType,
          created_at: new Date(action.timestamp.seconds * 1000).toISOString().replace('T', ' ').replace('Z', ''),
          address: blockMeta.producerAddress,
          height: blockMeta.height,
          to_address: '',
          validator: '',
          duration: 0,
          validator_list: [],
          amount: '0',
          auto_stake: false,
        }

        if (actionType === IotexActionType.transfer && actionCore.transfer) {
          actionEvent.amount = parseInt(actionCore.transfer.amount).toString()
          actionEvent.to_address = actionCore.transfer.recipient
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.stakeCreate && actionCore.stakeCreate) {
          actionEvent.amount = actionCore.stakeCreate.stakedAmount
          actionEvent.validator = actionCore.stakeCreate.candidateName
          actionEvent.auto_stake = actionCore.stakeCreate.autoStake
          actionEvent.duration = actionCore.stakeCreate.stakedDuration
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.stakeAddDeposit && actionCore.stakeAddDeposit) {
          actionEvent.amount = actionCore.stakeAddDeposit.amount
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.execution && actionCore.execution) {
          actionEvent.amount = actionCore.execution.amount
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.putPollResult && actionCore.putPollResult) {
          if (actionCore.putPollResult.candidates) {
            actionEvent.validator_list = actionCore.putPollResult.candidates.candidates.map(c => c.address)
          }

          if (actionCore.putPollResult.height) {
            actionEvent.height = typeof actionCore.putPollResult.height === 'string' ? parseInt(actionCore.putPollResult.height) : actionCore.putPollResult.height
          }
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.StakeChangeCandidate && actionCore.stakeChangeCandidate) {
          actionEvent.validator = actionCore.stakeChangeCandidate.candidateName
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.stakeRestake && actionCore.stakeRestake) {
          actionEvent.duration = actionCore.stakeRestake.stakedDuration
          actionEvent.auto_stake = actionCore.stakeRestake.autoStake
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.candidateRegister && actionCore.candidateRegister) {
          actionEvent.amount = actionCore.candidateRegister.stakedAmount
          actionEvent.duration = actionCore.candidateRegister.stakedDuration
          actionEvent.auto_stake = actionCore.candidateRegister.autoStake
          actionEvent.validator = actionCore.candidateRegister.candidate.name
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.candidateUpdate && actionCore.candidateUpdate) {
          actionEvent.validator = actionCore.candidateUpdate.name
          events.push(actionEvent as EventTableSchema)
        }

        if (actionType === IotexActionType.claimFromRewardingFund && actionCore.claimFromRewardingFund) {
          actionEvent.amount = actionCore.claimFromRewardingFund.amount
        }

        if (actionType === IotexActionType.depositToRewardingFund && actionCore.depositToRewardingFund) {
          actionEvent.amount = actionCore.depositToRewardingFund.amount
          events.push(actionEvent as EventTableSchema)
        }

        // if (actionType === IotexActionType.grantReward) {}
        // if (actionType === IotexActionType.stakeUnstake) {}
        // if (actionType === IotexActionType.stakeWithdraw) {}
        return actionEvent
      })
      events.push(...blockActions as EventTableSchema[])
    }
    return {
      hash: blockMeta.hash,
      events
    }
  }
}
export function newIotexService (opt: IotexServiceOptions): IotexService {
  return new IotexService(opt)
}