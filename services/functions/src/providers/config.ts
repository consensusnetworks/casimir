import { ethers } from 'ethers'
import CasimirUpkeepAbi from '@casimir/ethereum/build/abi/CasimirUpkeep.json'
import FunctionsOracleAbi from '@casimir/ethereum/build/abi/FunctionsOracle.json'
import FunctionsBillingRegistryAbi from '@casimir/ethereum/build/abi/FunctionsBillingRegistry.json'

export function getConfig() {
    const ethereumUrl = process.env.ETHEREUM_RPC_URL
    if (!ethereumUrl) throw new Error('No ethereum rpc url provided')

    const mnemonic = process.env.BIP39_SEED
    if (!mnemonic) throw new Error('No mnemonic provided')
    const accountPath = 'm/44\'/60\'/0\'/0/2'
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, accountPath)

    const functionsBillingRegistryAbi = FunctionsBillingRegistryAbi
    const functionsBillingRegistryAddress = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS
    if (!functionsBillingRegistryAddress) throw new Error('No functions billing registry address provided')
    
    const functionsOracleAbi = FunctionsOracleAbi
    const functionsOracleAddress = process.env.FUNCTIONS_ORACLE_ADDRESS
    if (!functionsOracleAddress) throw new Error('No functions oracle address provided')

    return {
        ethereumUrl,
        functionsBillingRegistryAbi,
        functionsBillingRegistryAddress,
        functionsOracleAbi,
        functionsOracleAddress,
        wallet
    }
}