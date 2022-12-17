import ganache from 'ganache'

const forkingUrl = process.env.ETHEREUM_FORKING_URL as string
const forkingNetwork = forkingUrl?.includes('mainnet') ? 'mainnet' : 'goerli'
const forkingChainId = { mainnet: 1, goerli: 5 }[forkingNetwork]
const mnemonic = process.env.BIP39_SEED as string

const options = {
    mnemonic,
    fork: forkingUrl ? { url: forkingUrl } : undefined,
    allowUnlimitedContractSize: true,
    totalAccounts: 5,
    defaultBalanceEther: 96,
    chain: {
        chainId: forkingChainId
    }
}
const server = ganache.server(options)
const port = 8545
server.listen(port, async () => {
  console.log(`Ganache listening on port ${port}`)
})
