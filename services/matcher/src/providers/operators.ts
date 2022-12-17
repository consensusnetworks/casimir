import { Operator } from '@casimir/types'
import { fetch } from 'undici'
import { FetchOperatorsResponse } from '../interfaces/FetchOperatorsResponse'

export default function useOperators() {
    async function getOperators () {
        // Todo move the following query logic to Athena
        const operators = await fetchOperators()
        // const averageFee = operators.reduce()
        const eligibleOperators: Operator[] = operators.filter(operator => {
            // Todo set a standard deviation
            // const feeEligible = ...
            const performanceEligible = [
                operator.performance['24h'], 
                operator.performance['30d']
            ].every(p => p > 85)
            const statusEligible = operator.status === 'Active'
            return /*feeEligible && */performanceEligible && statusEligible
        })
        return eligibleOperators.slice(0, 4)
    }

    async function fetchOperators () {
        const response = await fetch('https://api.ssv.network/api/v1/operators?perPage=5000&ordering=validators_count%3Aasc')
        const { /*pagination, */operators } = await response.json() as FetchOperatorsResponse  
        // console.log(pagination)
        return operators
    }

    return { getOperators }
}