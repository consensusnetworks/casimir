import { fromIni } from '@aws-sdk/credential-providers'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

function getProfile() {
    return process.env.PROFILE || 'consensus-networks-dev'
}

async function getSecret(id: string) {
    const profile = getProfile()
    const aws = new SecretsManagerClient({ credentials: fromIni({ profile }) })

    const { SecretString } = await aws.send(
        new GetSecretValueCommand(
            { 
                SecretId: id
            }
        )
    )

    return SecretString
}

export { getProfile, getSecret }
