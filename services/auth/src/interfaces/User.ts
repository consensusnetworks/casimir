export default interface User {
    address: string
    accounts: Array<{
        address: string
        currency: string
        balance: string
        balanceSnapshots: Array<{   
            date: string
            balance: string
        }>
        roi: number
        walletProvider: string
    }>
}