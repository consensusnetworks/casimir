import { ethers } from "ethers"
import { getEventsIterable } from "@casimir/events"
import { getStartBlock, updateErrorLog, updateStartBlock } from "@casimir/logs"
import ICasimirFactoryAbi from "@casimir/ethereum/build/abi/ICasimirFactory.json"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirRegistryAbi from "@casimir/ethereum/build/abi/ICasimirRegistry.json"
import ICasimirUpkeepAbi from "@casimir/ethereum/build/abi/ICasimirUpkeep.json"
import IEigenLayerBeaconOracleAbi from "@casimir/ethereum/build/abi/IEigenLayerBeaconOracle.json"
import { ICasimirFactory } from "@casimir/ethereum/build/@types"
import { HandlerInput } from "./interfaces/HandlerInput"
import { Config } from "./providers/config"
import { mockValidatorHandler, updateValidatorsHandler } from "./handlers/update-validators"
import { fundAccountsHandler } from "./handlers/fund-accounts"
import { initiateValidatorHandler } from "./handlers/initiate-validator"
import { deactivateOperatorHandler } from "./handlers/deactivate-operator"
import { withdrawValidatorsHandler } from "./handlers/withdraw-validator"

async function main() {
    const config = new Config()
    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const factory = new ethers.Contract(config.factoryAddress, ICasimirFactoryAbi, provider) as ICasimirFactory
    const managerConfigs = await Promise.all((await factory.getManagerIds()).map(async (id) => {
        return await factory.getManagerConfig(id)
    }))

    const contracts = {
        CasimirManager: {
            abi: ICasimirManagerAbi,
            addresses: managerConfigs.map(({ managerAddress }) => managerAddress),
            events: {
                ValidatorInitiationRequested: initiateValidatorHandler
            }
        },
        CasimirRegistry: {
            abi: ICasimirRegistryAbi,
            addresses: managerConfigs.map(({ registryAddress }) => registryAddress),
            events: {
                OperatorDeactivationRequested: deactivateOperatorHandler
            }
        },
        CasimirUpkeep: {
            abi: ICasimirUpkeepAbi,
            addresses: managerConfigs.map(({ upkeepAddress }) => upkeepAddress),
            events: {
                ValidatorWithdrawalsRequested: withdrawValidatorsHandler
            }
        },
        EigenLayerBeaconOracle: {
            abi: IEigenLayerBeaconOracleAbi,
            addresses: [config.beaconOracleAddress],
            events: {
                EigenLayerBeaconOracleUpdate: updateValidatorsHandler
            }
        }
    }

    const contractFilters = Object.values(contracts).map((contract) => {
        return {
            abi: contract.abi,
            addresses: contract.addresses,
            events: Object.keys(contract.events)
        }
    })

    let startBlock
    if (process.env.USE_LOGS === "true") {
        startBlock = getStartBlock("block.log")
    }

    const eventsIterable = getEventsIterable({
        contractFilters,
        ethereumUrl: config.ethereumUrl,
        startBlock
    })

    const handlers: Record<string, (input: HandlerInput) => Promise<void>> = {}
    for (const contract of Object.values(contracts)) {
        for (const [event, handler] of Object.entries(contract.events)) {
            handlers[event as keyof typeof handlers] = handler
        }
    }

    await mockValidatorHandler()
    
    for await (const event of eventsIterable) {
        console.log(`Received ${event.event} event from ${event.address}`)
        let eventManagerConfigs = managerConfigs.filter(({ managerAddress, registryAddress, upkeepAddress }) => {
            return [
                managerAddress,
                registryAddress,
                upkeepAddress
            ].includes(event.address)
        })
        if (!eventManagerConfigs.length) eventManagerConfigs = managerConfigs
        const args = event.args as ethers.utils.Result
        const handler = handlers[event.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${event.event}`)
        await fundAccountsHandler({ managerConfigs: eventManagerConfigs })
        await handler({ managerConfigs: eventManagerConfigs, args })
        if (process.env.USE_LOGS === "true") {
            // Todo remove dependency on start block using destination events
            updateStartBlock("block.log", event.blockNumber + 1)
        }
    }
}

main().catch(error => {
    if (process.env.USE_LOGS === "true") {
        updateErrorLog("error.log", (error as Error).message)
    } else {
        console.log(error)
    }    
    process.exit(1)
})





