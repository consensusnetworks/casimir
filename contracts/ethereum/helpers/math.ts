export function round(num: number, decimals: number | undefined = 1) {
    const multiplier = Math.pow(10, decimals)
    return Math.round(num * multiplier) / multiplier
}