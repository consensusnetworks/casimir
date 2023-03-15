import { spawn } from 'child_process'
import { fromIni } from '@aws-sdk/credential-providers'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { ethers } from 'ethers'

/**
 * Gets a secret from AWS Secrets Manager.
 * @param id secret id
 * @returns secret string
 */
export async function getSecret(id: string) {
    const aws = new SecretsManagerClient({})
    const { SecretString } = await aws.send(
        new GetSecretValueCommand(
            {
                SecretId: id
            }
        )
    )
    return SecretString
}

/**
 * Ensures AWS credentials are available and returns them.
 * Checks for AWS credentials in the environment variables.
 * If not found, loads credentials from `AWS_PROFILE` or the default profile.
 * @returns AWS credentials
 */
export async function loadCredentials() {
    const defaultProfile = 'consensus-networks-dev'
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        process.env.AWS_PROFILE = process.env.AWS_PROFILE || defaultProfile
        return await fromIni()()
    }
    return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
}

/**
 * Convert any string to camelCase.
 * @param string - The input string
 * @returns A camelCase string from the input string
 */
export function camelCase(string: string): string {
    const words = string.split('-').map(word => {
        return word.replace(/\w+/g, (word) => {
            return word[0].toUpperCase() + word.slice(1).toLowerCase()
        })
    })
    return words[0].toLowerCase() + words.slice(1).join('')
}

/**
 * Convert any string to PascalCase
 *
 * @param string - The input string
 * @returns A PascalCase string from the input string
 *
 */
export function pascalCase(string: string): string {
    const words = string.split('-').map(word => {
        return word.replace(/\w+/g, (word) => {
            return word[0].toUpperCase() + word.slice(1).toLowerCase()
        })
    })
    return words.join('')
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
 * Run any shell command with a spawned child process and return a promise.
 * @param fullCommand - The full command to run
 * @returns A promise that resolves when the command exits
 */
export async function run(fullCommand: string) {
    const [command, ...args] = fullCommand.split(' ')
    const child = spawn(command, args)
    let data = ''
    return new Promise((resolve, reject) => {
        child.on('error', reject)
        child.stdout.on('data', chunk => {
            process.stdout.write(chunk.toString())
            data += chunk.toString()
        })
        child.on('exit', () => resolve(data))
    })
}

/**
 * Retry a fetch request.
 * @param {RequestInfo} info - URL string or request object
 * @param {RequestInit} init - Request init options
 * @param {number | undefined} retriesLeft - Number of retries left (default: 5)
 * @returns {Promise<Response>} Response
 * @example
 * const response = await retry('https://example.com')
 */
export async function retry(info: RequestInfo, init?: RequestInit, retriesLeft: number | undefined = 25): Promise<Response> {
    if (retriesLeft === 0) {
        throw new Error('API request failed after maximum retries')
    }

    try {
        const response = await fetch(info, init)
        if (response.status !== 200) {
            await new Promise(resolve => setTimeout(resolve, 5000))
            console.log('Retrying fetch request to', info, init)
            return await retry(info, init || {}, retriesLeft - 1)
        }
        return response
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log('Retrying fetch request to', info, init)
        return await retry(info, init || {}, retriesLeft - 1)
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
export function getWallet(mnemonic?: string) {
    if (mnemonic) {
        return ethers.Wallet.fromMnemonic(mnemonic)
    }
    return ethers.Wallet.createRandom()
}