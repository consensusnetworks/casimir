import SpeculosHttpTransport from '@casimir/hw-transport-speculos'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import Eth from '@ledgerhq/hw-app-eth'

export default function useLedger() {

    const bip32Path = '44\'/60\'/0\'/0/0'

    async function getLedgerEthSigner() {
        const transport = await _getLedgerTransport()
        return new Eth(transport)
    }

    async function _getLedgerTransport() {
        if (import.meta.env.PUBLIC_SPECULOS_PORT) {
            return await SpeculosHttpTransport.open(`http://127.0.0.1:${import.meta.env.PUBLIC_SPECULOS_PORT}`)
        } else {
            return await TransportWebHID.create()
        }
    }

    return {
        bip32Path,
        getLedgerEthSigner
    }
}