import Btc from '@ledgerhq/hw-app-btc'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'

export default async function bitcoinLedgerSigner () {
    try {
        const transport = await TransportWebUSB.create()
        const btc = new Btc({ transport })
        const { bitcoinAddress } = await btc.getWalletPublicKey(
            'm/44\'/0\'/0\'',
            { format: 'legacy', verify: false }
        )
        console.log('bitcoinAddress :>> ', bitcoinAddress)
    } catch (error) {
        console.log('error :>> ', error)
    }
}