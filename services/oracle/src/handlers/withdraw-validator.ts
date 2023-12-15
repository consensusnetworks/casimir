import { ethers } from "ethers"
import { CasimirManager, CasimirViews } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirViewsAbi from "@casimir/ethereum/build/abi/ICasimirViews.json"
import { Scanner } from "@casimir/ssv"
import { POOL_STATUS } from "@casimir/env"
import { Config } from "../providers/config"
import { HandlerInput } from "../interfaces/HandlerInput"

export async function withdrawValidatorsHandler(input: HandlerInput) {
    const config = new Config()
    const { managerConfigs, args } = input
    const { managerAddress, viewsAddress } = managerConfigs[0]
    const count = args?.count
    if (!count) throw new Error("No count provided")

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
    const views = new ethers.Contract(viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

    /**
     * In production, we get the completed exit order from the Beacon API (sorting by withdrawn epoch)
     * We check all validators using:
     * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
     * Here, we're just grabbing the next exiting pool for each completed exit
     */
    const stakedPoolIds = await manager.getStakedPoolIds()
    let remaining = count
    let poolIndex = 0
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolConfig = await views.getPoolConfig(poolId)
        if (poolConfig.status === POOL_STATUS.EXITING_FORCED || poolConfig.status === POOL_STATUS.EXITING_REQUESTED) {
            remaining--
            
            /**
             * In production, we use the SSV performance data to determine blame
             * We check all validators using:
             * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
             * Here, we're just hardcoding blame to the first operator if less than 32 ETH
             */
            const operatorIds = poolConfig.operatorIds.map((operatorId) => operatorId.toNumber())
            let blamePercents = [0,
                0,
                0,
                0]
            if (poolConfig.balance.lt(ethers.utils.parseEther("32"))) {
                blamePercents = [100,
                    0,
                    0,
                    0]
            }

            const scanner = new Scanner({
                ethereumUrl: config.ethereumUrl,
                ssvNetworkAddress: config.ssvNetworkAddress,
                ssvViewsAddress: config.ssvViewsAddress
            })

            const cluster = await scanner.getCluster({ 
                ownerAddress: manager.address,
                operatorIds
            })

            const withdrawValidator = await manager.withdrawValidator(
                poolIndex,
                blamePercents,
                cluster
            )
            await withdrawValidator.wait()
        }
        poolIndex++
    }
}