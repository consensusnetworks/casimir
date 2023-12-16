export function encodeUint32(value: number) {
    const size = 32
    const totalLength = size
    const byteArray = new Uint8Array(totalLength)
    byteArray.set(new Uint8Array(new ArrayBuffer(4)))
    byteArray[28] = (value >>> 24) & 0xff
    byteArray[29] = (value >>> 16) & 0xff
    byteArray[30] = (value >>> 8) & 0xff
    byteArray[31] = value & 0xff
    return byteArray
}

export function encodeUint32Array(values: number[]) {
    const size = 32
    const totalLength = size * values.length
    const byteArray = new Uint8Array(totalLength)  
    for (let i = 0; i < values.length; i++) {
        const value = values[i]
        const startIndex = i * size + 28
        byteArray[startIndex] = (value >>> 24) & 0xff
        byteArray[startIndex + 1] = (value >>> 16) & 0xff
        byteArray[startIndex + 2] = (value >>> 8) & 0xff
        byteArray[startIndex + 3] = value & 0xff
    }
    return byteArray
}

export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0)
    const concatenatedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const array of arrays) {
        concatenatedArray.set(array, offset)
        offset += array.length
    }
    return concatenatedArray
}