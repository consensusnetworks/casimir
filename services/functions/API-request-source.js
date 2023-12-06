const [
    ,
    viewsAddress,
    getCompoundablePoolIdsSignature,
    getDepositedPoolCountSignature,
    getDepositedPoolPublicKeysSignature,
    getDepositedPoolStatusesSignature,
    getSweptBalanceSignature,
    ,
    ,
    ,
    requestType
] = args
const ethereumUrl = secrets.ethereumRpcUrl ?? "http://127.0.0.1:8545"
const ethereumBeaconUrl = secrets.ethereumBeaconRpcUrl ?? "http://127.0.0.1:5052"

switch (requestType) {
case "1":
    return await balancesHandler()
case "2":
    return await detailsHandler()
default:
    throw new Error("Invalid request type")
}

async function balancesHandler() {
    const depositedPoolCount = await getDepositedPoolCount()
    const startIndex = BigInt(0).toString(16).padStart(64, "0")
    const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, "0")

    const depositedPoolPublicKeys = await getDepositedPoolPublicKeys(startIndex, endIndex)
    console.log("depositedPoolPublicKeys", depositedPoolPublicKeys)
    const depositedPoolStatuses = await getDepositedPoolStatuses(startIndex, endIndex)
    console.log("depositedPoolStatuses", depositedPoolStatuses)
    const validators = await getValidators(depositedPoolPublicKeys)

    const beaconBalance = Functions.gweiToWei(validators.reduce((accumulator, { balance }) => {
        accumulator += parseFloat(balance)
        return accumulator
    }, 0))

    const sweptBalance = Functions.gweiToWei(await getSweptBalance(startIndex, endIndex))

    console.log("Results", {
        beaconBalance,
        sweptBalance
    })

    return Buffer.concat([
        Functions.encodeUint128(beaconBalance),
        Functions.encodeUint128(sweptBalance)
    ])
}

async function detailsHandler() {
    const depositedPoolCount = await getDepositedPoolCount()
    const startIndex = BigInt(0).toString(16).padStart(64, "0")
    const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, "0")

    // const depositedPoolPublicKeys = await getDepositedPoolPublicKeys(startIndex, endIndex)
    // const depositedPoolStatuses = await getDepositedPoolStatuses(startIndex, endIndex) // Not used yet
    // const validators = await getValidators(depositedPoolPublicKeys)

    const activatedDeposits = 0 // Hardcoded, next update will resolve

    const forcedExits = 0 // Hardcoded, next update will resolve

    const completedExits = 0 // Hardcoded, next update will resolve

    const compoundablePoolIds = await getCompoundablePoolIds(startIndex, endIndex)

    console.log("Results", {
        activatedDeposits,
        forcedExits,
        completedExits,
        compoundablePoolIds
    })

    return Buffer.concat([
        encodeUint32(activatedDeposits),
        encodeUint32(forcedExits),
        encodeUint32(completedExits),
        encodeUint32Array(compoundablePoolIds)
    ])
}

async function getCompoundablePoolIds(startIndex, endIndex) {
    const request = await Functions.makeHttpRequest({
        url: ethereumUrl,
        method: "POST",
        data: {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
                {
                    to: viewsAddress,
                    data: getCompoundablePoolIdsSignature + startIndex + endIndex
                },
                "latest"
            ]
        }
    })
    if (request.error) throw new Error("Failed to get compoundable pool IDs")
    const data = request.data.result.slice(2).match(/.{1,64}/g)
    let poolIds = []
    for (const item of data) {
        let poolId = parseInt(item, 16)
        poolIds.push(poolId)
    }
    return poolIds
}

async function getDepositedPoolCount() {
    const request = await Functions.makeHttpRequest({
        url: ethereumUrl,
        method: "POST",
        data: {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
                {
                    to: viewsAddress,
                    data: getDepositedPoolCountSignature
                },
                "latest"
            ]
        }
    })
    if (request.error) throw new Error("Failed to get deposited pool count")
    return Number(request.data.result)
}

async function getDepositedPoolPublicKeys(startIndex, endIndex) {
    const request = await Functions.makeHttpRequest({
        url: ethereumUrl,
        method: "POST",
        data: {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
                {
                    to: viewsAddress,
                    data: getDepositedPoolPublicKeysSignature + startIndex + endIndex
                },
                "latest"
            ]
        }
    })
    if (request.error) throw new Error("Failed to get validator public keys")
    const chunkChars = 64
    const chunks = request.data.result.slice(2).match(new RegExp(`.{1,${chunkChars}}`, "g"))
    // Contract response:
    // [
    //  "0x8889a628f263c414e256a1295c3f49ac1780e0b9cac8493dd1bd2f17b3b257660a12fb88f65333fa00c9a735c0f8d0e8",
    // 	"0x853b4caf348bccddbf7e1c25e68676c3b3f857958c93b290a2bf84974ea33c4f793f1bbf7e9e9923f16e2237038e7b69"
    // ]
    // Chunks:
    // [
    //  '0000000000000000000000000000000000000000000000000000000000000020', // Array start at 0x20 (32)
    //  '0000000000000000000000000000000000000000000000000000000000000002', // Array size is 2
    //  '0000000000000000000000000000000000000000000000000000000000000040', 
    //  '00000000000000000000000000000000000000000000000000000000000000a0',
    //  '0000000000000000000000000000000000000000000000000000000000000030', // Length of bytes is 0x30 (48)
    //  '8889a628f263c414e256a1295c3f49ac1780e0b9cac8493dd1bd2f17b3b25766',
    //  '0a12fb88f65333fa00c9a735c0f8d0e800000000000000000000000000000000',
    //  '0000000000000000000000000000000000000000000000000000000000000030', // Length of bytes is 0x30 (48)
    //  '853b4caf348bccddbf7e1c25e68676c3b3f857958c93b290a2bf84974ea33c4f',
    //  '793f1bbf7e9e9923f16e2237038e7b6900000000000000000000000000000000'
    // ]
    // Contract response:
    // [
    //  "0xa2a641b314a505a0cc0c75096cae3f2895db4ced87fe96c781677bbea1b9b60348799100965cbda987219ef1477b2152"
    // 	"0x8889a628f263c414e256a1295c3f49ac1780e0b9cac8493dd1bd2f17b3b257660a12fb88f65333fa00c9a735c0f8d0e8",
    // 	"0x853b4caf348bccddbf7e1c25e68676c3b3f857958c93b290a2bf84974ea33c4f793f1bbf7e9e9923f16e2237038e7b69"
    // ]
    // Chunks:
    // [
    //  '0000000000000000000000000000000000000000000000000000000000000020', // Array start at 0x20 (32)
    //  '0000000000000000000000000000000000000000000000000000000000000003', // Array size is 3
    //  '0000000000000000000000000000000000000000000000000000000000000060', // First item start at 0x60 (96)
    //  '00000000000000000000000000000000000000000000000000000000000000c0', // Second item start at 0xc0 (192)
    //  '0000000000000000000000000000000000000000000000000000000000000120', // Third item start at 0x120 (288)
    //  '0000000000000000000000000000000000000000000000000000000000000030', // Length of bytes is 0x30 (48)
    //  'a2a641b314a505a0cc0c75096cae3f2895db4ced87fe96c781677bbea1b9b603',
    //  '48799100965cbda987219ef1477b215200000000000000000000000000000000',
    //  '0000000000000000000000000000000000000000000000000000000000000030', // Length of bytes is 0x30 (48)
    //  '8889a628f263c414e256a1295c3f49ac1780e0b9cac8493dd1bd2f17b3b25766',
    //  '0a12fb88f65333fa00c9a735c0f8d0e800000000000000000000000000000000',
    //  '0000000000000000000000000000000000000000000000000000000000000030', // Length of bytes is 0x30 (48)
    //  '853b4caf348bccddbf7e1c25e68676c3b3f857958c93b290a2bf84974ea33c4f',
    //  '793f1bbf7e9e9923f16e2237038e7b6900000000000000000000000000000000'
    // ]
    const arrayIndex = (parseInt(chunks[0], 16) * 2) / chunkChars
    const itemSize = parseInt(chunks[arrayIndex], 16)
    const publicKeys = []
    for (let i = 0; i < itemSize; i++) {
        const itemIndex = (parseInt(chunks[arrayIndex + i + 1], 16) * 2) / chunkChars + itemSize - 1
        const itemChars = parseInt(chunks[itemIndex], 16) * 2
        const chunkCount = Math.ceil(itemChars / chunkChars)
        let publicKey = "0x"
        let remainingItemCharCount = itemChars
        for (let j = 0; j < chunkCount; j++) {
            const itemChunk = chunks[itemIndex + 1 + j]
            const itemChunkCharCount = Math.min(remainingItemCharCount, chunkChars)
            publicKey += itemChunk.slice(0, itemChunkCharCount)
            remainingItemCharCount -= itemChunkCharCount
        }
        publicKeys.push(publicKey)
    }
    return publicKeys
}

async function getDepositedPoolStatuses(startIndex, endIndex) {
    const request = await Functions.makeHttpRequest({
        url: ethereumUrl,
        method: "POST",
        data: {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
                {
                    to: viewsAddress,
                    data: getDepositedPoolStatusesSignature + startIndex + endIndex
                },
                "latest"
            ]
        }
    })
    if (request.error) throw new Error("Failed to get validator statuses")
    const chunkChars = 64
    const chunks = request.data.result.slice(2).match(new RegExp(`.{1,${chunkChars}}`, "g"))
    // Contract response:
    // [
    // 	2,
    // 	2,
    // 	2
    // ]
    // Chunks:
    // [
    // 	'0000000000000000000000000000000000000000000000000000000000000020',
    // 	'0000000000000000000000000000000000000000000000000000000000000003',
    // 	'0000000000000000000000000000000000000000000000000000000000000002',
    // 	'0000000000000000000000000000000000000000000000000000000000000002',
    // 	'0000000000000000000000000000000000000000000000000000000000000002'
    // ]
    const arrayIndex = (parseInt(chunks[0], 16) * 2) / chunkChars
    const itemSize = parseInt(chunks[arrayIndex], 16)
    const statuses = []
    let itemIndex = arrayIndex + 1
    for (let i = 0; i < itemSize; i++) {
        let status = parseInt(chunks[itemIndex], 16)
        statuses.push(status)
        itemIndex += 1
    }
    return statuses
}

async function getSweptBalance(startIndex, endIndex) {
    const request = await Functions.makeHttpRequest({
        url: ethereumUrl,
        method: "POST",
        data: {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
                {
                    to: viewsAddress,
                    data: getSweptBalanceSignature + startIndex + endIndex
                },
                "latest"
            ]
        }
    })
    if (request.error) throw new Error("Failed to get swept balance")
    const data = request.data.result.slice(2)
    return parseInt(data, 16)
}

async function getValidators(validatorPublicKeys) {
    const request = await Functions.makeHttpRequest({
        url: `${ethereumBeaconUrl}/eth/v1/beacon/states/finalized/validators?id=${validatorPublicKeys.join(",")}`
    })
    if (request.error) throw new Error("Failed to get validators")
    return request.data.data
}

function encodeUint32(value) {
    const buffer = Buffer.alloc(32)
    buffer.writeUInt32BE(value, 28)
    return buffer
}

function encodeUint32Array(values) {
    const buffer = Buffer.alloc(32 * values.length)
    for (let i = 0; i < values.length; i++) {
        buffer.writeUInt32BE(values[i], i * 32 + 28)
    }
    return buffer
}