import ganache from 'ganache'

// Seed is provided
const mnemonic = process.env.BIP39_SEED as string

// Mining interval is provided
const miningInterval = parseInt(process.env.MINING_INTERVAL as string)
const mining = { blockTime: miningInterval }

// Local network fork rpc is provided
const forkingUrl = process.env.ETHEREUM_FORKING_URL as string
const forkingNetwork = forkingUrl?.includes('mainnet') ? 'mainnet' : 'goerli'
const forkingChainId = { mainnet: 1, goerli: 5 }[forkingNetwork]

const options = {
    mnemonic,
    fork: forkingUrl ? { url: forkingUrl } : undefined,
    allowUnlimitedContractSize: true,
    totalAccounts: 5,
    defaultBalanceEther: 96,
    chain: {
        chainId: forkingChainId || 1337
    },
    miner: miningInterval ? mining : undefined
}
const server = ganache.server(options)
const port = 8545
server.listen(port, async () => {
  console.log(`Ganache listening on port ${port}`)
})
