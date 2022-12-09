import { Operator } from './Operator'
import { Pagination } from './Pagination'

export interface FetchOperatorsResponse {
    pagination: Pagination
    operators: Operator[]
}