import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import { Currency, ProviderString } from '@casimir/types'

export default function useWallet() {
  const { getLedgerAddress } = useLedger()
  const { getTrezorAddress } = useTrezor()

  function getColdStorageAddress(provider: ProviderString, currency: Currency = 'ETH') {
    if (provider === 'Ledger') {
      new Promise((resolve, reject) => {
        resolve(getLedgerAddress[currency]())
      })
    } else if (provider === 'Trezor') {
      new Promise((resolve, reject) => {
        resolve(getTrezorAddress[currency]())
      })
    } else {
      return new Promise((resolve, reject) => {
        resolve('Cold storage provider not yet supported')
      })
    }
  }

  return {
    getColdStorageAddress
  }
}