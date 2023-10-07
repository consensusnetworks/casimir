import MOCK_OPERATORS from './mock/operators.json'
import MOCK_RESHARES from './mock/reshares.json'
import MOCK_VALIDATORS from './mock/validators.json'

const ETHEREUM_CONTRACTS = {
    TESTNET: {
        MANAGER_ADDRESS: '0xFBA09a098014b414A4aBD2C1Ca43383Ad63f8492',
        REGISTRY_ADDRESS: '0x5c118E76cCfBEAd615BBB2B485c0729c69CEac1a',
        UPKEEP_ADDRESS: '0x449AcFeb4769C283dcB94ae09779A3233A9c3653',
        VIEWS_ADDRESS: '0x1EcF11435187dCb07aA758Db006cA98EA381817b',

        FUNCTIONS_BILLING_REGISTRY_ADDRESS: '0x736fe8342E7BA5bF50757D266391b675394D9458',
        FUNCTIONS_ORACLE_ADDRESS: '0x599E62F28a185c2F68c6DC82CD7dDd450C44d587',
        FUNCTIONS_ORACLE_FACTORY_ADDRESS: '0x45b277aD532172c9DDc079729F233875fD8B649D',

        POOL_BEACON_ADDRESS: '0x443d84cB8b116B9620F6807280160E8C6d6D4b5e',
        REGISTRY_BEACON_ADDRESS: '0x8E1539E198CB13dB0abce5CBB62a34eA2E0aF513',
        UPKEEP_BEACON_ADDRESS: '0xEeBc166D29A19cA47d2D15B2f0c3Fe1211F50821',

        BEACON_DEPOSIT_ADDRESS: '0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b',
        DAO_ORACLE_ADDRESS: '',
        KEEPER_REGISTRAR_ADDRESS: '0x57A4a13b35d25EE78e084168aBaC5ad360252467',
        KEEPER_REGISTRY_ADDRESS: '0xE16Df59B887e3Caa439E0b29B42bA2e7976FD8b2',
        LINK_ETH_FEED_ADDRESS: '0xb4c4a493AB6356497713A78FFA6c60FB53517c63',
        LINK_TOKEN_ADDRESS: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
        SSV_NETWORK_ADDRESS: '0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D',
        SSV_TOKEN_ADDRESS: '0x3a9f01091C446bdE031E39ea8354647AFef091E7',
        SSV_VIEWS_ADDRESS: '0xAE2C84c48272F5a1746150ef333D5E5B51F68763',
        SWAP_FACTORY_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        WETH_TOKEN_ADDRESS: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
    }
}

enum ETHEREUM_NETWORK_NAME {
    TESTNET = 'goerli'
}

enum ETHEREUM_RPC_URL {
    TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
}

export { 
    ETHEREUM_CONTRACTS,
    ETHEREUM_NETWORK_NAME,
    ETHEREUM_RPC_URL,
    MOCK_OPERATORS,
    MOCK_RESHARES,
    MOCK_VALIDATORS
}