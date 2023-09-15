const ETHEREUM_CONTRACT_ADDRESSES = {
    TESTNET: {
        FunctionsOracleFactory: '0xfA2D8643D87E625004bcA263Bcd2002255fDD4BB',
        FunctionsOracle: '0xF89a8DDFdb39C6BB3125bBeA3BB356B40A99b46f',
        FunctionsBillingRegistry: '0x6310Cc8288aE5f70E914363c72F7d2e1D1C8533d',
        CasimirPoolBeacon: '0x98A6f99c1bD042b4B1B5C03755805a7FFac902e1',
        CasimirRegistryBeacon: '0x3FB35C4de1a1AeA102B192d28391227C93305cA5',
        CasimirUpkeepBeacon: '0x12CCBd11A592Bc7ad0405c15c90c8419b390E814',
        CasimirManager: '0x813aA99639F77A275b5bD5E12904cCd48826C19F',
        CasimirRegistry: '0x97d5b6F9801D2CdCB492e567b1246a837Cd8d2D4',
        CasimirUpkeep: '0x1A4f46e5209b71C11aeb6776fD161B80174B2a63',
        CasimirViews: '0xc9F69bD5F43153FB485cBF1DB907EE1eb28c9B29'
    }
}

enum ETHEREUM_FORK_URL {
    MAINNET = 'https://mainnet.infura.io/v3/46a379ac6895489f812f33beb726b03b',
    TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
}

enum ETHEREUM_NETWORK_NAME {
    MAINNET = 'mainnet',
    TESTNET = 'goerli'
}
enum ETHEREUM_NETWORK_URL {
    MAINNET = 'https://mainnet.infura.io/v3/46a379ac6895489f812f33beb726b03b',
    TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
}

export { ETHEREUM_CONTRACT_ADDRESSES, ETHEREUM_FORK_URL, ETHEREUM_NETWORK_NAME, ETHEREUM_NETWORK_URL }