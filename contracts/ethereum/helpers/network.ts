import { ethers } from "ethers"

export async function waitForNetwork(provider: ethers.providers.JsonRpcProvider) {
  let networkReady = false
  while (!networkReady) {
    try {
      await provider.getBlockNumber()
      networkReady = true
    } catch (error) {
      console.log("Waiting for network to start...")
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}