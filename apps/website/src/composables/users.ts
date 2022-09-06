export default function useUsers() {

    /**
     * Sign up a new user for email notifications
     * 
     * @param {string} email - The email address of the user 
     * @returns {Promise<Response>} - The response from the signup user API route
     */
    async function signupUser(email: string): Promise<Response> {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        }
        const usersBaseUrl = getUsersBaseUrl()
        return await fetch(`${usersBaseUrl}/users/signup`, requestOptions)
    }

    /**
     * Get the users base url for the current environment
     * 
     * @returns {string} The base URL for the users API
     */
    function getUsersBaseUrl(): string {
        if (import.meta.env.PUBLIC_MOCK) {
            return `http://localhost:${import.meta.env.PUBLIC_USERS_PORT}`
        } else {
            return `https://users.${import.meta.env.PUBLIC_STAGE || 'dev'}.casimir.co`
        }
    }

    return {
        signupUser
    }
}

