import { User } from '../interfaces/User'

const user: User = {
    address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212'.toLowerCase(),
    accounts: [
        {
            address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
            currency: 'ETH',
            balance: '1000000000000000000',
            balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
            roi: 0.25,
            walletProvider: 'MetaMask'
        },
        {
            address: '0x1dc336d94890b10e1a47b6e34cdee1009ee7b942',
            currency: 'ETH',
            balance: '1000000000000000000',
            balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
            roi: 0.25,
            walletProvider: 'CoinbaseWallet'
        },
        {
            address: '0x8222Ef172A2117D1C4739E35234E097630D94376',
            currency: 'ETH',
            balance: '1000000000000000000',
            balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
            roi: 0.25,
            walletProvider: 'Ledger'
        },
        {
            address: 'bc1qpttwf0df8jkx54dl04anwgmyt27lj6vj885lyr',
            currency: 'BTC',
            balance: '100000000',
            balanceSnapshots: [{ date: '2023-02-06', balance: '100000000' }, { date: '2023-02-05', balance: '100000000' }],
            roi: 0.25,
            walletProvider: 'Ledger'
        },
        {
            address: '0x8222Ef172A2117D1C4739E35234E097630D94377', // Fake address
            currency: 'ETH',
            balance: '1000000000000000000',
            balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
            roi: 0.25,
            walletProvider: 'Trezor'
        },
        {
            address: '0x8222Ef172A2117D1C4739E35234E097630D94378', // Fake address
            currency: 'ETH',
            balance: '1000000000000000000',
            balanceSnapshots: [{ date: '2023-02-06', balance: '1000000000000000000' }, { date: '2023-02-05', balance: '100000000000000000' }],
            roi: 0.25,
            walletProvider: 'WalletConnect'
        },
    ],
    nonce: '1234567890',
}

export const userCollection : Array<User> = [user]