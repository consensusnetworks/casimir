import { ethers } from 'ethers'

async function getAddress(mnemonic?: string) {
    const wallet = getWallet(mnemonic)
    return wallet.address
}

async function getKeystore(mnemonic?: string) {
    const wallet = getWallet(mnemonic)
    const keystoreString = await wallet.encrypt('')
    return JSON.parse(keystoreString)
}

function getWallet(mnemonic?: string) {
    if (mnemonic) {
        return ethers.Wallet.fromMnemonic(mnemonic)
    }
    return ethers.Wallet.createRandom()
}

export { getAddress, getKeystore, getWallet }
