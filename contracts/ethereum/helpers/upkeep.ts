import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager, CasimirUpkeep } from '../build/artifacts/types'

export enum RequestType {
    BALANCE = 0,
    DEPOSITS = 1,
    EXITS = 2,
    SLASHES = 3
}

export async function performReport({
    manager,
    upkeep,
    keeper,
    values,
    requestId
}: { 
    manager: CasimirManager,
    upkeep: CasimirUpkeep,
    keeper: SignerWithAddress,
    values: number[],
    requestId: number
}) {
    await runUpkeep({ upkeep, keeper })

    for (let i = 0; i < values.length; i++) {
        const value = values[i]
        const checkBalance = i == RequestType.BALANCE
        const checkDeposits = i == RequestType.DEPOSITS && (await manager.getPendingPoolIds()).length > 0
        const checkExits = i == RequestType.EXITS && (await manager.getExitingPoolCount()).toNumber() > 0
        const checkSlashes = i == RequestType.SLASHES
        if (checkBalance || checkDeposits || checkExits || checkSlashes) {
            requestId++
            await fulfillFunctionsRequest({
                upkeep,
                keeper,
                value: checkBalance ? ethers.utils.parseEther(value.toString()).toString() : value.toString(),
                requestId
            })
        }
    }

    await runUpkeep({ upkeep, keeper })

    return requestId
}

export async function runUpkeep({
    upkeep, keeper
}: {
    upkeep: CasimirUpkeep, keeper: SignerWithAddress
}) {
    let ranUpkeep = false
    const checkData = ethers.utils.toUtf8Bytes('')
    const { ...check } = await upkeep.connect(keeper).checkUpkeep(checkData)
    const { upkeepNeeded } = check
    if (upkeepNeeded) {
        const performData = ethers.utils.toUtf8Bytes('')
        const performUpkeep = await upkeep.connect(keeper).performUpkeep(performData)
        await performUpkeep.wait()
        ranUpkeep = true
    }
    return ranUpkeep
}

export async function fulfillFunctionsRequest({
    upkeep, 
    keeper, 
    value,
    requestId
}: {
    upkeep: CasimirUpkeep,
    keeper: SignerWithAddress,
    value: string,
    requestId: number
}) {
    const requestIdHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256'], [requestId]))
    const response = ethers.BigNumber.from(value)
    const responseBytes = ethers.utils.defaultAbiCoder.encode(['uint256'], [response.toString()])
    const errorBytes = ethers.utils.toUtf8Bytes('')
    const mockFulfillRequest = await upkeep.connect(keeper).mockFulfillRequest(requestIdHash, responseBytes, errorBytes)
    await mockFulfillRequest.wait()
}

export function packResponse({ values, bits }: { values: string[], bits: number[] }) {    
    let packed = ethers.BigNumber.from('0')
    values.forEach((value, i) => {
        if (i === 0) {
            console.log('active value', value)
            packed = ethers.BigNumber.from(value)
        } else {
            const shift = bits.slice(0, i).reduce((a, b) => a + b, 0)
            packed = packed.or(ethers.BigNumber.from(value).shl(shift))
        }
    })
    return packed
}

export function unpackResponse({ packed, bits }: { packed: string, bits: number[] }) {
    return bits.map((_, i) => {
        if (i === 0) {
            return ethers.BigNumber.from(packed).and(ethers.BigNumber.from('0xFFFFFFFFFFFFFFFF')).toString()
        }
        const shift = bits.slice(0, i).reduce((a, b) => a + b, 0)
        return ethers.BigNumber.from(packed).shr(shift).and(ethers.BigNumber.from('0xFFFFFFFFFFFFFFFF')).toString()
    })
}
