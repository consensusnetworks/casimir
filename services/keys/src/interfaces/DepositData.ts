export interface DepositData {
    pubkey: string
    withdrawal_credentials: string
    amount: string
    signature: string
    deposit_message_root: string
    deposit_data_root: string
    fork_version: string,
    network_name: 'mainnet' | 'goerli',
    deposit_cli_version: string
}