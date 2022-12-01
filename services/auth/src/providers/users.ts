import userCollection from '../collections/users'

export default function useUsers() {
    function getMessage (address: string) {
        const user = userCollection.find(user => user.address === address)
        if (user) {
            return user.nonce
        }
        return ''
    }

    function updateMessage (address: string) {
        const user = userCollection.find(user => user.address === address)
        if (user) {
            user.nonce = generateNonce()
        } else {
            userCollection.push({ address, nonce: generateNonce() })
        }
    }
    
    return { getMessage, updateMessage }
}

function generateNonce() {
    return (Math.floor(Math.random()
        * (Number.MAX_SAFE_INTEGER - 1)) + 1).toString()
}