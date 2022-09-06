import SpeculosHttpTransport from '@casimir/hw-transport-speculos'
import Eth from '@ledgerhq/hw-app-eth'

export default function useLedger() {
    async function getLedgerAccount() {
        const transport = await SpeculosHttpTransport.open()
        const eth = new Eth(transport)
        const stuff = await eth.getAppConfiguration()
        console.log(stuff)
        const { address } = await eth.getAddress('44\'/60\'/0\'/0/0')
        return address
    }

    return {
        getLedgerAccount
    }
}