
import * as d3 from 'd3'
const parseTime = d3.timeParse('%d/%m/%Y')
export const dummy_user_account = {
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
    ]
}

export const eth_staked_data = [
    {
        date: parseTime('01/01/22'),
        price: '01.15'
    },
    {
        date: parseTime('01/02/22'),
        price: '01.35'
    },
    {
        date: parseTime('01/03/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/04/22'),
        price: '01.45'
    },
    {
        date: parseTime('01/05/22'),
        price: '01.85'
    },
    {
        date: parseTime('01/06/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/07/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/08/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/09/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/10/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/11/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/12/22'),
        price: '01.25'
    },
    {
        date: parseTime('01/01/23'),
        price: '01.15'
    },
    {
        date: parseTime('01/02/23'),
        price: '01.35'
    },
    {
        date: parseTime('01/03/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/04/23'),
        price: '01.45'
    },
    {
        date: parseTime('01/05/23'),
        price: '01.85'
    },
    {
        date: parseTime('01/06/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/07/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/08/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/09/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/10/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/11/23'),
        price: '01.25'
    },
    {
        date: parseTime('01/12/23'),
        price: '01.25'
    },
]
