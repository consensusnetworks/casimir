import { userCollection } from '../collections/users'
import { ProviderString } from '@casimir/types'

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
            console.log('got to else')
            userCollection.push({ 
                id: address,
                accounts: {
                    [provider]: [address]
                },
                primaryAccount: address,
                nonce: generateNonce() 
            })
        }
    }
    
    function generateNonce() {
        return (Math.floor(Math.random()
            * (Number.MAX_SAFE_INTEGER - 1)) + 1).toString()
    }
    
    return { getMessage, updateMessage, generateNonce }
}