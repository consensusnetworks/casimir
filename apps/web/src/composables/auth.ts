import { SignupCredentials } from '../interfaces/SignupCredentials'
import { LoginCredentials } from '../interfaces/LoginCredentials'
import useEnvironment from '@/composables/environment'
import { ProviderString } from '@/types/ProviderString'

const { authBaseURL } = useEnvironment()

export default function useAuth() {
    async function getMessage(provider: ProviderString, address: string) {
        const requestOptions = {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        }
        return await fetch(`${authBaseURL}/auth/${provider}/${address}`, requestOptions)
    }

    async function signUpAuth(signupCredentials: SignupCredentials) {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupCredentials)
        }
        const response = await fetch(`${authBaseURL}/signup`, requestOptions)
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
        return await fetch(`${authBaseURL}/login`, requestOptions)
    }

    return {
        signUpAuth,
        login,
        getMessage
    }
}