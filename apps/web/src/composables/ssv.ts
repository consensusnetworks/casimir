import { ethers } from 'ethers'
import { SSVManager } from '@casimir/ethereum/build/artifacts/types'
import { abi } from '@casimir/ethereum/build/artifacts/src/SSVManager.sol/SSVManager.json'

export default function useSSV() {
    /** Instance of the SSV Manager contract */
    const ssv = (() => {
        const address = import.meta.env.PUBLIC_SSV_ADDRESS
        if (!address) console.log(
            `
            The PUBLIC_SSV_ADDRESS environment variable is empty.\n
            If you are on mainnet or testnet, the contract does not exist yet.\n
            If you are on the local network, check your terminal logs for a contract address or errors.
            `
        )
        return new ethers.Contract(address, abi) as SSVManager
    })()

    return { ssv }
}