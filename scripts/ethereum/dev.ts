import { $, argv, echo, chalk } from 'zx'
import { getSecret } from '@casimir/aws-helpers'
import { getWallet } from '@casimir/ethers-helpers'
import { getContainerPort } from '@casimir/zx-helpers'

/**
 * Run local Ethereum nodes and deploy Ethereum contracts
 * 
 * Arguments:
 *      --fork: mainnet or testnet (optional, i.e., --fork=mainnet)
 *      --simulation: run full consensus/execution clients (optional, i.e., --simulation=true)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    // Get shared seed
    const seed = await getSecret('consensus-networks-bip39-seed')
    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(seed))
    
    if (argv.simulation === 'true') {
        // Todo check if run from git root
        const resourcePath = 'scripts/ethereum/resources'

        // Fetch remote submodule code
        $`git submodule update --init --recursive`

        await $`kurtosis enclave rm -f simulation`
        await $`kurtosis module exec --enclave-id simulation consensusnetworks/eth2-merge-kurtosis-module:latest --execute-params "$(cat ${resourcePath}/simulation/eth2-module-params.yml)"`
        process.env.ETHEREUM_EXECUTION_HTTP_PORT = await getContainerPort('ethereum/client-go:latest', '8545/tcp')
        process.env.ETHEREUM_EXECUTION_WS_PORT = await getContainerPort('ethereum/client-go:latest', '8546/tcp')
        process.env.ETHEREUM_CONSENSUS_HTTP_PORT = await getContainerPort('sigp/lighthouse:latest', '4000/tcp')
        
        let count = 0
        const wait = 300000
        const minute = 60000
        while (count < wait) {
            console.log('Minutes to merge:', (wait - count) / minute)
            await new Promise(resolve => setTimeout(resolve, minute))
            count += minute
        }

        await $`rm -rf contracts/ethereum/.openzeppelin`
        await $`npm run dev:ssv --workspace @casimir/ethereum -- --network geth`

        const wallet = getWallet(seed)
        process.env.WETH9_ADDRESS = '0x13AD7EB86A4724d3a262E609a53daf950d7Ca099'
        await $`npx @uniswap/deploy-v3 -pk ${wallet.privateKey} -j ${process.env.ETHEREUM_EXECUTION_HTTP_PORT} -w9 ${process.env.WETH9_ADDRESS} -ncl ETH -o ${wallet.address}`

        // $`${resourcePatownerh}/ssv/dev`
    } else {
        // Set fork rpc if requested, default fork to mainnet if set vaguely
        const networks = { mainnet: 'mainnet', testnet: 'goerli' }
        const fork = argv.fork === 'true' ? 'mainnet' : argv.fork === 'false' ? undefined : argv.fork
        if (fork) {
            const key = await getSecret(`consensus-networks-ethereum-${fork}`)
            const url = `https://eth-${networks[fork]}.g.alchemy.com/v2/${key}`
            process.env.ETHEREUM_FORK_URL = url
            echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(` fork at ${url}`))
        }

        process.env.INTERVAL_MINING = 'true'
        $`npm run dev:hardhat --workspace @casimir/ethereum`
    }

}()