import { ethers } from 'ethers'


function formatBytes(hexstring: string) {
    return ethers.utils.arrayify(hexstring)
}

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

void function main() {
    console.log(formatBytes('0x13b4682b21fe50088beff43530787d1dac1e50c8e0686ec55849c8c9c9c5c044'))
}()

export { getKeystore, getWallet }
