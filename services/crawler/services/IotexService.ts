import Antenna from 'iotex-antenna'
import { IActionInfo, IGetBlockMetasResponse, IGetChainMetaResponse, IGetReceiptByActionResponse, IGetServerMetaResponse } from 'iotex-antenna/lib/rpc-method/types'
import { from } from '@iotexproject/iotex-address-ts'
import { CandidateRegister, CandidateUpdate, StakeRestake, StakeWithdraw, StakeUnstake, StakeAddDeposit, ClaimFromRewardingFund, StakeCreate, StakeTransferOwnership } from 'iotex-antenna/lib/action/types'
import { DepositToRewardingFund } from 'iotex-antenna/protogen/proto/types/action_pb'

export interface IotexServiceOptions {
  network: IotexNetworkType
}

export enum IotexNetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet'
}

interface IotexBlock {
  type: string
  id: string
  height: string
  datestring: string
  producer: string
  amount: string
  transaction_root: string
  num_of_actions: number
}

export interface IotexGovernanaceActions {
  grantReward: any[]
  claimFromRewardingFund: ClaimFromRewardingFund[]
  depositToRewardingFund: DepositToRewardingFund[]
  candidateRegister: CandidateRegister[]
  candidateUpdate: CandidateUpdate[]
  createStake: StakeCreate[]
  stakeRestake: StakeRestake[]
  depositToStake: StakeAddDeposit[]
  transferStake: StakeTransferOwnership[]
  stakeUnstake: StakeUnstake[]
  stakeWithdraw: StakeWithdraw[]
}

export interface CreateStakeTableColumns {
  type: string
  datestring: string
  address: string
  staked_candidate: string
  staked_amount: number
  staked_duration: number
  auto_stake: boolean
}

export class IoTexService {
  network: IotexNetworkType
  endpoint: string
  client: Antenna
  constructor (opt: IotexServiceOptions) {
    this.network = opt.network ?? IotexNetworkType.Mainnet
    this.endpoint = this.network === IotexNetworkType.Mainnet ? 'https://api.iotex.one:443' : 'https://api.testnet.iotex.one:443'
    this.client = new Antenna(this.endpoint)
  }

  async getChainMetadata (): Promise<IGetChainMetaResponse> {
    const meta = await this.client.iotx.getChainMeta({})
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

  async getBlockLogs (hash: string): Promise<any> {
    const s = await this.client.iotx.getLogs({
      filter: {
        address: [],
        topics: []
      },
      byBlock: {
        blockHash: Buffer.from(hash, 'hex')
      }
    })

    return s
  }

  async getAccountActions (address: string): Promise<any> {
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
        count: 10
      }
    })

    return actions
  }

  async getServerMetadata (): Promise<IGetServerMetaResponse> {
    const meta = await this.client.iotx.getServerMeta({})
    return meta
  }

  // async testme (start: number, count: number): Promise<any> {
  //   const c = await this.client.iotx.getBlockMetas({
  //     byIndex: {
  //       start,
  //       count
  //     }
  //   })
  //   return c
  // }

  async getDepositToRewardingFundActions (start: number, count: number): Promise<any[]> {
    const actions = await this.getActionsByIndex(start, count)
    const depositToRewardingFundActions: any[] = []

    for (const action of actions) {
      if (action?.action?.core?.depositToRewardingFund != null) {
        depositToRewardingFundActions.push(action.action.core.depositToRewardingFund)
      }
    }

    return depositToRewardingFundActions
  }

  async getClaimRewardingFundActions (start: number, count: number): Promise<any[]> {
    const actions = await this.getActionsByIndex(start, count)

    const claimRewardingFundActions = []

    for (const action of actions) {
      if (action.action?.core?.claimFromRewardingFund !== undefined) {
        claimRewardingFundActions.push(action.action.core.claimFromRewardingFund)
      }
    }
    return claimRewardingFundActions
  }

  async getGrantRewardActions (start: number, count: number): Promise<any> {
    const actions = await this.getActionsByIndex(start, count)

    if (actions.length === 0) {
      throw new Error('Failed to get actions')
    }

    return await Promise.all(actions.filter(b => b.action.core?.grantReward !== undefined).map(async b => {
      b.action.senderPubKey = Buffer.from(b.action.senderPubKey).toString('hex')
      b.action.signature = Buffer.from(b.action.signature).toString('hex')

      const blockMeta = await this.getBlockMetaByHash(b.blkHash)

      const reciept = await this.getTxReceipt(b.actHash)

      return {
        type: 'grant_reward',
        datestring: new Date(b.timestamp.seconds * 1000).toISOString().split('T')[0],
        address: blockMeta.blkMetas[0].hash,
        grant_type: b.action.core?.grantReward?.type,
        blocks_hash: b.blkHash,
        receipt: reciept.receiptInfo?.receipt?.contractAddress
      }
    }))
  }

  async getTxReceipt (action: string): Promise<IGetReceiptByActionResponse> {
    const tx = await this.client.iotx.getReceiptByAction({
      actionHash: action
    })
    return tx
  }

  async getActionsByIndex (start: number, count: number): Promise<IActionInfo[]> {
    if (start < 0 || count < 0) {
      throw new Error('start and count must be greater than 0')
    }

    if (count === 0) {
      count = 100
    }

    if (start === 0) {
      start = 1
    }

    const actions = await this.client.iotx.getActions({
      byIndex: {
        start,
        count
      }
    })

    if (actions.actionInfo === null) {
      throw new Error('Failed to get actions')
    }

    return actions.actionInfo
  }

  async getGasPrice (): Promise<any> {
    const { gasPrice } = await this.client.iotx.suggestGasPrice({})
    return gasPrice
  }

  convertEthToIotx (eth: string): string {
    const add = from(eth)
    return add.string()
  }

  convertIotxToEth (iotx: string): string {
    const add = from(iotx)
    return add.stringEth()
  }
}

export async function newIotexService (opt?: IotexServiceOptions): Promise<IoTexService> {
  return new IoTexService({
    network: opt?.network ?? IotexNetworkType.Mainnet
  })
}
