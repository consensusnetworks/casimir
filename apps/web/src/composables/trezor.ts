import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'

const trezorPath = '44\'/60\'/0\'/0/0'

export default function useTrezor () {
    const hey = 'hey'
    const { getGasPriceAndLimit } = useEthers()
    return {
        hey
    }
}