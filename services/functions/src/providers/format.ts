import { ethers } from 'ethers'
import cbor from 'cbor'

/**
 * Decodes a CBOR hex string, and adds opening and closing brackets to the CBOR if they are not present.
 * @param hexstr The hex string to decode
 */
export function decodeDietCBOR(hex: string) {
    const buf = hexToBuf(hex)
    return cbor.decodeFirstSync(addCBORMapDelimiters(buf))
}

/**
 * Create a buffer from a hex string
 * @param hex The hex string to convert to a buffer
 */
export function hexToBuf(hex: string): Buffer {
    return Buffer.from(stripHexPrefix(hex), 'hex')
}

/**
 * Strip the leading 0x hex prefix from a hex string
 * @param hex The hex string to strip the leading hex prefix out of
 */
export function stripHexPrefix(hex: string): string {
    if (!ethers.utils.isHexString(hex)) {
        throw Error(`Expected valid hex string, got: "${hex}"`)
    }
    return hex.replace('0x', '')
}

/**
 * Add a starting and closing map characters to a CBOR encoding if they are not already present.
 */
export function addCBORMapDelimiters(buffer: Buffer): Buffer {
    if (buffer[0] >> 5 === 5) {
        return buffer
    }

    /**
     * This is the opening character of a CBOR map.
     * @see https://en.wikipedia.org/wiki/CBOR#CBOR_data_item_header
     */
    const startIndefiniteLengthMap = Buffer.from([0xbf])
    /**
     * This is the closing character in a CBOR map.
     * @see https://en.wikipedia.org/wiki/CBOR#CBOR_data_item_header
     */
    const endIndefiniteLengthMap = Buffer.from([0xff])
    return Buffer.concat(
        [startIndefiniteLengthMap, buffer, endIndefiniteLengthMap],
        buffer.length + 2,
    )
}