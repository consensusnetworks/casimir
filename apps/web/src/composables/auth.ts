import { SignupLoginCredentials } from '@casimir/types/src/interfaces/SignupLoginCredentials'
import { LoginCredentials } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import { ProviderString } from '@casimir/types'

const { usersBaseURL } = useEnvironment()

export default function useAuth() {
    async function getMessage(provider: ProviderString, address: string) {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        return await fetch(`${usersBaseURL}/auth/${provider}/${address}`, requestOptions)
    }

    async function signupOrLoginAuth(signupCredentials: SignupLoginCredentials) {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupCredentials)
        }
        return await fetch(`${usersBaseURL}/signupLogin`, requestOptions)
    }
    
    async function signUpAuth(signupCredentials: SignupLoginCredentials) {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupCredentials)
        }
        const response = await fetch(`${usersBaseURL}/signup`, requestOptions)
        return response
    }

    /**
     * Logs a user in with an address, message and signed message
     * 
     * @param {LoginCredentials} loginCredentials - The user's address, message and signed message 
     * @returns {Promise<Response>} - The response from the login request
     */
    async function login(loginCredentials: LoginCredentials): Promise<Response> {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginCredentials)
        }
        return await fetch(`${usersBaseURL}/login`, requestOptions)
    }

    return {
        signUpAuth,
        signupOrLoginAuth,
        login,
        getMessage
    }
}