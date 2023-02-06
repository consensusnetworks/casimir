
import * as d3 from 'd3'
const parseTime = d3.timeParse('%d/%m/%Y')

export const dummy_user_account = {
    id: '0xd557a5745d4560B24D36A68b52351ffF9c86A212',
    accounts: {
        MetaMask: [
            { 
                address: '0xd557a5745d4560B24D36A68b52351ffF9c86A212', 
                balance: '1252500',
                balance_usd: '163123.60',
                currency: 'ETH', 
                roi: 0.25 
            },
            { 
                address: 'io1nyjs526mnqcsx4twa7nptkg08eclsw5c2dywp4', 
                balance: '500000', 
                balance_usd: '123123.07',
                currency: 'IOTX', 
                roi: 0.56 
            }
        ],
        Ledger: [
            { 
                address: '0x345678987654567890876567890987657890876789', 
                balance: '1000000000', 
                balance_usd: '123123.00',
                currency: 'BTC', 
                roi: 0.75 
            }
        ],
        CoinbaseWallet: [
            { 
                address: '0x345678987654567890876567890987657890876789', 
                balance: '10000000', 
                balance_usd: '123123.00',
                currency: 'BTC', 
                roi: 0.75 
            },
            { 
                address: '0x345678987654567890876567890987657890876789', 
                balance: '10000000000', 
                balance_usd: '123123.00',
                currency: 'ETH', 
                roi: 0.75 
            },
        ]
    },
    primaryAccount: '',
    pools: []
}

export const eth_staked_data = 
[
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
