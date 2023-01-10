import { Operator, Share } from '@casimir/types'

export interface FetchDepositDataResponse {
    operators: Operator[]
    shares: Share[]
}