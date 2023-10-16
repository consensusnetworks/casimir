import { ethers } from "ethers"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"

export function getConfig() {
  const cliPath = process.env.CLI_PATH
  if (!cliPath) throw new Error("No cli path provided")
  const messengerUrl = process.env.MESSENGER_URL
  if (!messengerUrl) throw new Error("No messenger url provided")

  const ethereumUrl = process.env.ETHEREUM_RPC_URL
  if (!ethereumUrl) throw new Error("No ethereum rpc url provided")

  const mnemonic = process.env.BIP39_SEED
  if (!mnemonic) throw new Error("No mnemonic provided")
  const accountPath = "m/44'/60'/0'/0/1"
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, accountPath)

  const managerAbi = ICasimirManagerAbi
  const managerAddress = process.env.MANAGER_ADDRESS
  if (!managerAddress) throw new Error("No manager address provided")
  const registryAddress = process.env.REGISTRY_ADDRESS
  if (!registryAddress) throw new Error("No registry address provided")
  const viewsAddress = process.env.VIEWS_ADDRESS
  if (!viewsAddress) throw new Error("No views address provided")
  const functionsBillingRegistryAddress = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS
  if (!functionsBillingRegistryAddress) throw new Error("No functions billing registry address provided")
  const keeperRegistryAddress = process.env.KEEPER_REGISTRY_ADDRESS
  if (!keeperRegistryAddress) throw new Error("No link registry address provided")
  const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS
  if (!linkTokenAddress) throw new Error("No link token address provided")
  const ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS
  if (!ssvNetworkAddress) throw new Error("No ssv network address provided")
  const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS
  if (!ssvTokenAddress) throw new Error("No ssv token address provided")
  const ssvViewsAddress = process.env.SSV_VIEWS_ADDRESS
  if (!ssvViewsAddress) throw new Error("No ssv network views address provided")
  const uniswapV3FactoryAddress = process.env.SWAP_FACTORY_ADDRESS
  if (!uniswapV3FactoryAddress) throw new Error("No uniswap v3 factory address provided")
  const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS
  if (!wethTokenAddress) throw new Error("No weth token address provided")

  return {
    cliPath,
    messengerUrl,
    ethereumUrl,
    wallet,
    managerAbi,
    managerAddress,
    registryAddress,
    viewsAddress,
    functionsBillingRegistryAddress,
    keeperRegistryAddress,
    linkTokenAddress,
    ssvNetworkAddress,
    ssvTokenAddress,
    ssvViewsAddress,
    uniswapV3FactoryAddress,
    wethTokenAddress
  }
}
