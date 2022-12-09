import { Operator } from '../interfaces/Operator'
import useKeys from '../providers/keys'

const { getShares } = useKeys()

export default function useValidator () {
    async function getValidator (operators: Operator[]) {
        const shares = await getShares(operators)
        return { shares }
    }

    return { getValidator }
}