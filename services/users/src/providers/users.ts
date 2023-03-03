import { userCollection } from '../collections/users'
import { ProviderString } from '@casimir/types'
import { User } from '@casimir/types'

export default function useUsers() {
    function getMessage (address: string) {
        const user = userCollection.find(user => user.address === address)
        if (user) {
            return user.nonce
        }
        return ''
    }

    function updateMessage (provider: ProviderString, address: string) {
        const user = userCollection.find(user => user.address === address)
        provider = provider.toLowerCase()
        if (user) {
            user.nonce = generateNonce()
        } else {
            console.log('Create new user here?')
            const user: User = {
                address,
                nonce: generateNonce(),
            }
            userCollection.push(user)
        }
    }
    
    function generateNonce() {
        return (Math.floor(Math.random()
            * (Number.MAX_SAFE_INTEGER - 1)) + 1).toString()
    }
    
    return { getMessage, updateMessage, generateNonce }
}