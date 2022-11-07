import { $, argv, chalk, echo } from 'zx'
import { fromIni } from '@aws-sdk/credential-providers'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

/**
 * Test Ethereum contracts
 * 
 * Arguments:
 *      --fork: mainnet or testnet (optional, i.e., --fork=mainnet)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    // Fetch remote submodule code
    $`git submodule update --init --recursive`

    // Set AWS profile
    const profile = process.env.PROFILE || 'consensus-networks-dev'
    const aws = new SecretsManagerClient({ credentials: fromIni({ profile }) })
    echo(chalk.blue(`PROFILE is set to ${profile}`))

    // Set shared wallet seed
    const { SecretString: seed } = await aws.send(
        new GetSecretValueCommand(
            { 
                SecretId: 'consensus-networks-bip39-seed'
            }
        )
    )
    process.env.BIP39_SEED = seed
    echo(`Your mnemonic is ${seed}`)

    // Set fork rpc if requested
    const networks = {
        mainnet: 'mainnet',
        testnet: 'goerli'
    }
    const fork = argv.fork === 'true' ? 'mainnet' : argv.fork
    if (fork) {
        const { SecretString: key } = await aws.send(
            new GetSecretValueCommand(
                { 
                    SecretId: `consensus-networks-ethereum-${fork}`
                }
            )
        )
        const rpc = `https://eth-${networks[fork]}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORK_RPC = rpc
        echo(`Using ${fork} fork at ${rpc}`)
    }

    $`npm run test --workspace @casimir/ethereum`
}()
