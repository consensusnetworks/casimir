import { operatorStore } from '@casimir/data'
import { getConfig } from './config'

const config = getConfig()

/**
 * Get operator URLs
 * @param {number[]} operatorIds - Operator IDs
 * @returns {<Record<string, string>} Operator group
 */
export function getOperatorUrls(operatorIds: number[]): Record<string, string> {
    return operatorIds.reduce((group: Record<string, string>, id: number) => {
        const key = id.toString() as keyof typeof operatorStore
        group[key] = operatorStore[key]
        return group
    }, {})
}