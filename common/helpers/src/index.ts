import { spawn } from 'child_process'
import { fromIni } from '@aws-sdk/credential-providers'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

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
 * Convert any string to camelCase
 * 
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
 * Convert any string to snake_case
 *
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
 * Convert any string to kebab-case
 * 
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
 * Spawn a full command with a child process and return a promise
 * @param fullCommand - The full command to run
 * @returns A promise that resolves when the command exits
 */
export async function spawnPromise(fullCommand: string) {
    const [command, ...args] = fullCommand.split(' ')
    const child = spawn(command, args)
    return new Promise((resolve, reject) => {
        child.on('error', reject)
        child.on('exit', resolve)
    })
}