import { Validator } from '@casimir/types'

export interface CLIOutput {
    /** Status */
    status: number
    /** Validator */
    validator: Validator
}