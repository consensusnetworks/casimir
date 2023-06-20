import useEnvironment from '@/composables/environment'
import { LoginCredentials } from '@casimir/types'

const { domain, origin, usersBaseURL } = useEnvironment()

export default function useAuth() {

    /**
     * Creates the message from the server to sign, which includes getting the nonce from auth server
     * 
     * @param {ProviderString} address - The address the user is using to sign in
     * @param {string} statement - The statement the user is signing
     * @returns {Promise<Response>} - The response from the message request
     */ 
    async function createSiweMessage(address: string, statement: string) {
        try {
            const requestOptions = {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address
                })
            }
            const res = await fetch(`${usersBaseURL}/auth/nonce`, requestOptions)
            const { error, message: resMessage, data: nonce } = (await res.json())
            if (error) throw new Error(resMessage)
            const message = {
                domain,
                address,
                statement,
                uri: origin,
                version: '1',
                chainId: 5,
                nonce
            }
            return prepareMessage(message)
        } catch (error) {
            throw new Error(error.message || 'Error creating SIWE message')
        }
    }

    /**
     * Signs user up if they don't exist, otherwise
     * logs the user in with an address, message, and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, provider, currency, message, and signed message 
     * @returns {Promise<Response>} - The response from the login request
     */
    async function signInWithEthereum(loginCredentials: LoginCredentials) {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginCredentials)
        }
        return await fetch(`${usersBaseURL}/auth/login`, requestOptions)
    }

    return {
        createSiweMessage,
        signInWithEthereum
    }
}

function prepareMessage(obj: any) {
    const {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
    } = obj
  
    const issuedAt = new Date().toISOString()
    const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}`
  
    return message
}