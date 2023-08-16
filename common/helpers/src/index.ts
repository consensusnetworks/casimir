import { exec, execSync } from 'child_process'
import { ethers } from 'ethers'

/**
 * Convert any string to camelCase.
 * @param string - The input string
 * @returns A camelCase string from the input string
 */
export function camelCase(string: string): string {
    const words = string.split(/[\s_-]+/).map(word => {
        return word.replace(/\w+/g, (word) => {
            return word[0].toUpperCase() + word.slice(1).toLowerCase()
        })
    })
    const result = words.join('')
    return result[0].toLowerCase() + result.slice(1)
}

/**
 * Convert any string to PascalCase
 *
 * @param string - The input string
 * @returns A PascalCase string from the input string
 *
 */
export function pascalCase(string: string): string {
    const words = string.split(/[\s_-]+/).map(word => {
        return word.replace(/\w+/g, (word) => {
            return word[0].toUpperCase() + word.slice(1).toLowerCase()
        })
    })
    const result = words.join('')
    return result
}

/**
 * Convert any string to snake_case.
 * @param string - The input string
 * @returns A snake_case string from the input string
 */
export function snakeCase(string: string): string {
    return string.replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_')
}

/**
 * Convert any string to kebab-case.
 * @param string - The input string
 * @returns A kebab-case string from the input string
 */
export function kebabCase(string: string): string {
    return string.replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('-')
}

/**
 * Run any shell command in a child process and return a promise
 * @param command - The full command to run
 * @returns A promise that resolves when the command exits
 */
export async function run(command: string) {
    const child = exec(command)
    let data = ''
    return new Promise((resolve, reject) => {
        child.on('error', reject)
        child.stdout?.on('data', chunk => {
            process.stdout.write(chunk.toString())
            data += chunk.toString()
        })
        child.stderr?.on('data', chunk => {
            process.stdout.write(chunk.toString())
        })
        child.on('exit', () => {
            resolve(data)
        })
    })
}

/**
 * Retry run any shell command in a child process and return a promise
 * @param command - The full command to run
 * @param retriesLeft - Number of retries left (default: 5)
 * @returns A promise that resolves when the command exits
 */
export async function runRetry(command: string, retriesLeft: number | undefined = 25): Promise<unknown> {
    if (retriesLeft === 0) {
        throw new Error('Command failed after maximum retries')
    }
    try {
        return await run(command)
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log('Retrying command', command)
        return await runRetry(command, retriesLeft - 1)
    }
}

/**
 * Run any shell command synchronously in a child process
 * @param command - The full command to run
 * @returns The output of the command
 */
export function runSync(command: string) {
    return execSync(command).toString()
}

/**
 * Retry a fetch request.
 * @param {RequestInfo} info - URL string or request object
 * @param {RequestInit} init - Request init options
 * @param {number | undefined} retriesLeft - Number of retries left (default: 5)
 * @returns {Promise<Response>} Response
 * @example
 * const response = await fetchRetry('https://example.com')
 */
export async function fetchRetry(info: RequestInfo, init?: RequestInit, retriesLeft: number | undefined = 25): Promise<Response> {
    if (retriesLeft === 0) {
        throw new Error('API request failed after maximum retries')
    }

    try {
        const response = await fetch(info, init)        
        if (response.status !== 200) {
            await new Promise(resolve => setTimeout(resolve, 5000))
            console.log('Retrying fetch request to', info, init)
            return await fetchRetry(info, init || {}, retriesLeft - 1)
        }
        return response
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log('Retrying fetch request to', info, init)
        return await fetchRetry(info, init || {}, retriesLeft - 1)
    }
}

/** 
 * Get a wallet address (optionially from a mnemonic).
 * @param mnemonic - The wallet mnemonic (optional)
 * @returns The wallet address
 */
export async function getWalletAddress(mnemonic?: string) {
    const wallet = getWallet(mnemonic)
    return wallet.address
}

/** 
 * Get a wallet keystore (optionially from a mnemonic).
 * @param mnemonic - The wallet mnemonic (optional)
 * @returns The wallet keystore
 */
export async function getWalletKeystore(mnemonic?: string) {
    const wallet = getWallet(mnemonic)
    const keystoreString = await wallet.encrypt('')
    return JSON.parse(keystoreString)
}

/** 
 * Get a wallet (optionially from a mnemonic).
 * @param mnemonic - The wallet mnemonic (optional)
 * @returns The wallet
 */
export function getWallet(mnemonic?: string): ethers.Wallet {
    if (mnemonic) {
        return ethers.Wallet.fromMnemonic(mnemonic)
    }
    return ethers.Wallet.createRandom()
}

/**
 * Get withdrawal credentials from withdrawal address
 * @param {string} withdrawalAddress - Withdrawal address
 * @returns {string} Withdrawal credentials
 */
export function getWithdrawalCredentials(withdrawalAddress: string): string {
    return '01' + '0'.repeat(22) + withdrawalAddress.split('0x')[1]
}

export async function getFutureContractAddress({ wallet, nonce, index }: { 
    wallet: ethers.Wallet,
    nonce: number, 
    index?: number 
}): Promise<string> {
    return ethers.utils.getContractAddress({ 
        from: wallet.address, 
        nonce: nonce + (index || 0) 
    })
}