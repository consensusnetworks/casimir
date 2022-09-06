import SpeculosHttpTransport from '@casimir/hw-transport-speculos'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import Eth from '@ledgerhq/hw-app-eth'

export default function useLedger() {

    const ledgerEthPath = '44\'/60\'/0\'/0/0'

    async function getLedgerEthSigner() {
        const transport = await _getLedgerTransport()
        return new Eth(transport)
    }

    async function _getLedgerTransport() {
        if (import.meta.env.PUBLIC_LEDGER) {
            return await SpeculosHttpTransport.open()
        } else {
            return await TransportWebHID.create()
        }
    }

    return {
        ledgerEthPath,
        getLedgerEthSigner
    }
}