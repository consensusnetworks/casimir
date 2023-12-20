export function gweiToWei(gwei: number) {
    return BigInt(gwei) * BigInt(1000000000)
}