import useKeygen from './keygen'
import useOperators from './operators'

const { fetchDepositData } = useKeygen()
const { getOperators } = useOperators()

export default function useValidator () {
    async function getValidator (withdrawalAddress: string) {
        const operators = await getOperators()
        return await fetchDepositData(withdrawalAddress, operators)
    }

    return { getValidator }
}