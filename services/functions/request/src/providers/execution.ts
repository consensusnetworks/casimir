import { ExecutionOptions } from "../interfaces/ExecutionOptions.ts"
import { ExecutionResponseData } from "../interfaces/ExecutionResponseData.ts"

export class Execution {
    public readonly ethereumUrl: string
    public readonly viewsAddress: string

    constructor(options: ExecutionOptions) {
        this.ethereumUrl = options.ethereumUrl
        this.viewsAddress = options.viewsAddress
    }

    async getCompoundablePoolIds(startIndex: string, endIndex: string, blockNumber?: number) {
        const methodSignature = "0x0812a9fe"
        const request = await Functions.makeHttpRequest({
            url: this.ethereumUrl,
            method: "post",
            data: {
                id: 1,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [
                    {
                        to: this.viewsAddress,
                        data: methodSignature + startIndex + endIndex
                    },
                    blockNumber || "latest"
                ]
            }
        })
        if (request.error) throw new Error("Failed to get compoundable pool IDs")
        const { result } = request.data as ExecutionResponseData
        const data = result.slice(2).match(/.{1,64}/g) as RegExpMatchArray
        const poolIds = []
        for (const item of data) {
            const poolId = parseInt(item, 16)
            poolIds.push(poolId)
        }
        return poolIds
    }
    
    async getStakedPoolCount(blockNumber?: number) {
        const methodSignature = "0x91cae538"
        const request = await Functions.makeHttpRequest({
            url: this.ethereumUrl,
            method: "post",
            data: {
                id: 1,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [
                    {
                        to: this.viewsAddress,
                        data: methodSignature
                    },
                    blockNumber || "latest"
                ]
            }
        })
        if (request.error) throw new Error("Failed to get deposited pool count")
        const { result } = request.data as ExecutionResponseData
        return Number(result)
    }
    
    async getStakedPoolPublicKeys(startIndex: string, endIndex: string, blockNumber?: number) {
        const methodSignature = "0x05601fe6"
        const request = await Functions.makeHttpRequest({
            url: this.ethereumUrl,
            method: "post",
            data: {
                id: 1,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [
                    {
                        to: this.viewsAddress,
                        data: methodSignature + startIndex + endIndex
                    },
                    blockNumber || "latest"
                ]
            }
        })
        if (request.error) throw new Error("Failed to get validator public keys")
        const { result } = request.data as ExecutionResponseData
        const chunkChars = 64
        const chunks = result.slice(2).match(new RegExp(`.{1,${chunkChars}}`, "g")) as RegExpMatchArray
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
    
    async getStakedPoolStatuses(startIndex: string, endIndex: string, blockNumber?: number) {
        const methodSignature = "0xca25993f"
        const request = await Functions.makeHttpRequest({
            url: this.ethereumUrl,
            method: "post",
            data: {
                id: 1,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [
                    {
                        to: this.viewsAddress,
                        data: methodSignature + startIndex + endIndex
                    },
                    blockNumber || "latest"
                ]
            }
        })
        if (request.error) throw new Error("Failed to get validator statuses")
        const chunkChars = 64
        const { result } = request.data as ExecutionResponseData
        const chunks = result.slice(2).match(new RegExp(`.{1,${chunkChars}}`, "g")) as RegExpMatchArray
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
            const status = parseInt(chunks[itemIndex], 16)
            statuses.push(status)
            itemIndex += 1
        }
        return statuses
    }
    
    async getSweptBalance(startIndex: string, endIndex: string, blockNumber?: number) {
        const methodSignature = "0x12c3456b"
        const request = await Functions.makeHttpRequest({
            url: this.ethereumUrl,
            method: "post",
            data: {
                id: 1,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [
                    {
                        to: this.viewsAddress,
                        data: methodSignature + startIndex + endIndex
                    },
                    blockNumber || "latest"
                ]
            }
        })
        if (request.error) throw new Error("Failed to get swept balance")
        const { result } = request.data as ExecutionResponseData
        const data = result.slice(2)
        return parseInt(data, 16)
    }
}