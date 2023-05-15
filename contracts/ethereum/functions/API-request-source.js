// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below

const managerAddress = "0x07e05700cb4e946ba50244e27f01805354cd8ef0"
// We want to get a string (not bytes) array of length of the number of validators
// See PoR Address List
const getValidatorPublicKeys = "0xeab1442e"
const getSweptRewards = "0x9d816764"

const getPublicKeys = await Functions.makeHttpRequest({
    url: 'http://localhost:8545',
    method: 'POST',
    data: {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
            to: managerAddress,
            data: getValidatorPublicKeys
        }, 'latest'],
        id: 1
    }
})

const { result } = getPublicKeys.data

// Remove the '0x' prefix
let raw = result.slice(2);

// Fetch the number of keys from the start of the data
let numKeys = parseInt(raw.slice(0, 64), 16);

// Initial offset is 32 bytes (or 64 characters), multiplied by 2 for hex
let offset = 64 * 2;

let publicKeys = [];

for (let i = 0; i < numKeys; i++) {
  // Extract each public key
  let publicKey = raw.slice(offset, offset + 128);
  publicKeys.push('0x' + publicKey);

  // Move the offset to the next key
  offset += 128;
}

console.log(publicKeys);

// To make an HTTP request, use the Functions.makeHttpRequest function
// Functions.makeHttpRequest function parameters:
// - url
// - method (optional, defaults to 'GET')
// - headers: headers supplied as an object (optional)
// - params: URL query parameters supplied as an object (optional)
// - data: request body supplied as an object (optional)
// - timeout: maximum request duration in ms (optional, defaults to 10000ms)
// - responseType: expected response type (optional, defaults to 'json')

const validatorPublicKeys = [
    "0x974dc2826f2d7d413dbe67da0333c1a462ee4194239dfec22cf06989b7aa6f174a3603bb6f55cbf6a57a858e972b4f7d",
    "0xb02a546d0a6c73b1fb12cf001b30a645ebe217399200d25af547ffef244dc9c4747a974c785fde00a2f925465dc957ec",
    "0x800269a2708150b8560cd8d88d30be15bd661a3d8eddb080717e9cd4deb425b9aa88e720676fc98c716b75f72c136a6f",
    "0x800015473bdc3a7f45ef8eb8abc598bc20021e55ad6e6ad1d745aaef9730dd2c28ec08bf42df18451de94dd4a6d24ec5"
]

const url = secrets.ethereumApiUrl

console.log(`Making request to ${url}`)

const response = {
    data: new Array(),
    error: false
}

const sync = await Functions.makeHttpRequest({
    url: `${url}/eth/v1/node/syncing`
})

if (sync.error) {
    response.error = true
} else {
    const { head_slot: headSlot } = sync.data.data
    console.log(`Head slot: ${headSlot}`)
}

const registeredValidators = await Functions.makeHttpRequest({
    url: `${url}/eth/v1/beacon/states/finalized/validators?id=${validatorPublicKeys.join(',')}`
})

if (registeredValidators.error) {
    response.error = true
} else {
    for (const { index, balance, status, validator } of registeredValidators.data.data) {

        if (status === 'withdrawal_done') {

            const withdrawalEpoch = validator.withdrawable_epoch
            const slotsPerEpoch = 32
            const slot = withdrawalEpoch * slotsPerEpoch

            const exitedValidator = await Functions.makeHttpRequest({
                url: `${url}/eth/v1/beacon/states/${slot}/validators/${index}`
            })

            if (exitedValidator.error) {
                response.error = true
                break
            } else {
                const { balance } = exitedValidator.data.data
                validator.exited_effective_balance = parseInt(balance.slice(0, 2)) >= 32 ? '32000000000' : balance
            }
        }

        response.data.push({ ...validator, balance, status })
    }
}

const validators = ethereumApiResponse.data.map((validator) => {
    console.log(validator)

    return {
        publicKey: validator.pubkey,
        balance: validator.balance,
        exitedBalance: validator.exited_balance,
        status: validator.status
    }
})

// The source code MUST return a Buffer or the request will return an error message
// Use one of the following functions to convert to a Buffer representing the response bytes that are returned to the client smart contract:
// - Functions.encodeUint256
// - Functions.encodeInt256
// - Functions.encodeString
// Or return a custom Buffer for a custom byte encoding
return Functions.encodeUint256(packedReport)