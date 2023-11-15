import { fromIni } from "@aws-sdk/credential-providers"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

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
    if (!SecretString) {
        throw new Error(`No secret found for ${id}`)
    }
    return SecretString
}

/**
 * Ensures AWS credentials are available and returns them.
 * Checks for AWS credentials in the environment variables.
 * If not found, loads credentials from `AWS_PROFILE` or the default profile.
 * @returns AWS credentials
 */
export async function loadCredentials() {
    const defaultProfile = "consensus-networks-dev"
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        process.env.AWS_PROFILE = process.env.AWS_PROFILE || defaultProfile
        return await fromIni()()
    }
    return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
}