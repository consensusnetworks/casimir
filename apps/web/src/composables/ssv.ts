import { ethers } from 'ethers'
import { SSVManager } from '@casimir/ethereum/build/artifacts/types'
import { abi } from '@casimir/ethereum/build/artifacts/src/SSVManager.sol/SSVManager.json'
import useEnvironment from './environment'

/** SSV Manager contract */
let ssv: SSVManager

export default function useSSV() {
    const { ethereumURL } = useEnvironment()

    if (!ssv) {
        ssv = (() => {
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
    }

    async function getSSVFeePercent() {
        const provider = new ethers.providers.JsonRpcProvider(ethereumURL)
        const ssvProvider = ssv.connect(provider)
        const fees = await ssvProvider.getFees()
        const { LINK, SSV } = fees
        const feesTotalPercent = LINK + SSV
        const feesRounded = Math.round(feesTotalPercent * 100) / 100
        return feesRounded
    }

    return { ssv, getSSVFeePercent }
}