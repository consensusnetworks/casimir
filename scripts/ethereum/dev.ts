import { $, argv, echo, chalk } from 'zx'
import { getSecret } from '@casimir/aws-helpers'

/**
 * Run local Ethereum nodes and deploy Ethereum contracts
 * 
 * Arguments:
 *      --fork: mainnet or testnet (optional, i.e., --fork=mainnet)
 *      --simulation: run full consensus/execution clients (optional, i.e., --simulation=true)
 *      --ssv: deploy and run ssv network (optional, i.e., --ssv=true)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    // Todo check if run from git root
    const resourcePath = 'scripts/ethereum/resources'

    // Fetch remote submodule code
    $`git submodule update --init --recursive`

    // Get shared resources
    const seed = await getSecret('consensus-networks-bip39-seed')
    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(seed))

    // Set fork rpc if requested, default fork to mainnet if set vaguely
    const networks = { mainnet: 'mainnet', testnet: 'goerli' }
    const fork = argv.fork === 'true' ? 'mainnet' : argv.fork === 'false' ? undefined : argv.fork
    if (fork) {
        const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        const rpc = `https://eth-${networks[fork]}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORK_RPC = rpc
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(` fork at ${rpc}`))
    }
    
    if (argv.simulation === 'true') {
        // await $`kurtosis enclave rm -f eth2`
        // await $`kurtosis module exec --enclave-id eth2 consensusnetworks/eth2-merge-kurtosis-module:latest --execute-params "$(cat ${resourcePath}/simulation/eth2-module-params.yml)"`
        $`scripts/ssv/dev`
    } else {
        $`npm run dev:hardhat --workspace @casimir/ethereum`
    }
    // $`npm run deploy:ssv --workspace @casimir/ethereum -- --network geth`
    // $`npm run deploy:beacon --workspace @casimir/ethereum -- --network geth`
}()