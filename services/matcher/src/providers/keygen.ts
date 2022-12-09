import { fetch } from 'undici'
import { Operator } from '@casimir/types'
import { FetchDepositDataResponse } from '../interfaces/FetchDepositDataResponse'

export default function useKeygen () {
    async function fetchDepositData(withdrawalAddress: string, operators: Operator[]) {
        const options = {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({ withdrawalAddress, operators })
        }
        const response = await fetch('http://localhost:8500/create', options)
        return await response.json() as FetchDepositDataResponse
    }

    return { fetchDepositData }
}