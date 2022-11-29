import userCollection from '../collections/users'
function getMessage (address: string) {
    const user = userCollection.find(user => user.address === address)
    if (user) {
        return user.message
    }
    return ''
}

export default getMessage