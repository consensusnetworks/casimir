import useKeys from './keys'
import useOperators from './operators'

const { getShares } = useKeys()
const { getOperators } = useOperators()

export default function useValidator () {

    async function getValidatorInit(withdrawalAddress: string) {
        console.log(withdrawalAddress)
        const operators = await getOperators()
        const shares = await getShares(operators)
        // Todo return Beacon deposit and SSV registry input data for a new validator
        return { operators, shares }
    }

    return { getValidatorInit }
}