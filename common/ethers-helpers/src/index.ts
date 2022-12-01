import { ethers } from 'ethers'

async function getKeystore(mnemonic?: string) {
    const wallet = getWallet(mnemonic)
    console.log(wallet.privateKey)
    return await wallet.encrypt('')
}

function getWallet(mnemonic?: string) {
    if (mnemonic) {
        return ethers.Wallet.fromMnemonic(mnemonic)
    }
    return ethers.Wallet.createRandom()
}

export { getKeystore, getWallet }
