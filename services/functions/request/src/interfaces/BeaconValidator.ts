export interface BeaconValidator {
    index: string
    balance: string
    status: "pending_initialized" | "pending_queued" | "active_ongoing" | "active_exiting" | "active_slashed" | "exited_unslashed" | "exited_slashed" | "withdrawal_possible" | "withdrawal_done"
    validator: {
        pubkey: string
        withdrawal_credentials: string
        effective_balance: string
        slashed: boolean
        activation_eligibility_epoch: string
        activation_epoch: string
        exit_epoch: string
        withdrawable_epoch: string
    }
}