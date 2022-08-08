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

  async getTxReceipt (actionHash: string): Promise<IGetReceiptByActionResponse> {
    const tx = await this.client.iotx.getReceiptByAction({ actionHash })
    return tx
  }

  async getActionsByIndex (index: number, count: number): Promise<any> {
    const actions = await this.client.iotx.getActions({
      byIndex: {
        start: index,
        count: count
      }
    })

    if (actions.actionInfo === null) {
      throw new Error('Failed to get actions')
    }

    return actions.actionInfo
  }

  convertToGlueSchema(type: string, action: IActionInfo): any {
    switch (type) {
      case 'create_stake':
        if (action.action.core?.stakeCreate === undefined) throw new Error('Invalid action type')

        const s = action.action.core?.stakeCreate

        return {
          type: 'create_stake',
          datestring: new Date(action.timestamp.seconds * 1000).toISOString(),
          address: Buffer.from(action.action.senderPubKey).toString('hex'),
          staked_candidate: s.candidateName,
          staked_amout: s.stakedAmount,
          staked_duration: s.stakedDuration,
          auto_stake: action.action.core.stakeCreate.autoStake
        }
        default:
          console.log(action.action.core)
          throw new Error('Unknown action type')
      }
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
