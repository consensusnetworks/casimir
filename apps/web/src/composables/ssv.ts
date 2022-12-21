import { ethers } from 'ethers'
import { SSVManager } from '@casimir/ethereum/build/artifacts/types'
import { abi } from '@casimir/ethereum/build/artifacts/src/SSVManager.sol/SSVManager.json'
import { ProviderString } from '@/types/ProviderString'

// TODO: This is now duplicated in wallet.ts and ssv.ts
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnect from '@/composables/walletConnect'

const { getEthersBrowserSigner } = useEthers()
const { getEthersLedgerSigner } = useLedger()
const { getEthersTrezorSigner } = useTrezor()
const { isWalletConnectSigner, getEthersWalletConnectSigner } = useWalletConnect()

const ethersSignerCreator = {
    'MetaMask': getEthersBrowserSigner,
    'CoinbaseWallet': getEthersBrowserSigner,
    'Ledger': getEthersLedgerSigner,
    'Trezor': getEthersTrezorSigner,
    'WalletConnect': getEthersWalletConnectSigner
}

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

    async function getSSVFeePercent(selectedProvider: ProviderString) {
        const signerKey = selectedProvider as keyof typeof ethersSignerCreator
        let signer = ethersSignerCreator[signerKey](selectedProvider)
        if (isWalletConnectSigner(signer)) signer = await signer
        const ssvProvider = ssv.connect(signer as ethers.Signer)
        const fees = await ssvProvider.getFees()
        const { LINK, SSV } = fees
        const feesTotalPercent = LINK + SSV
        const feesRounded = Math.round(feesTotalPercent * 100) / 100
        return feesRounded
    }

    return { ssv, getSSVFeePercent }
}