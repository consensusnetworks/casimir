import { Operator } from '@casimir/types'
import { Pagination } from './Pagination'

export interface FetchOperatorsResponse {
    pagination: Pagination
    operators: Operator[]
}