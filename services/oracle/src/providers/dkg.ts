import fs from "fs"
import { run } from "@casimir/shell"
import { InitInput } from "../interfaces/InitInput"
import { ReshareInput } from "../interfaces/ReshareInput"
import { Reshare, SSVOperator, Validator } from "@casimir/types"
import { DkgOptions } from "../interfaces/DkgOptions"

export class Dkg {
    public readonly cliPath: string
    public readonly configPath: string

    constructor(options: DkgOptions) {
        this.cliPath = options.cliPath
        this.configPath = options.configPath
    }

    /**
     * Init a new DKG and create a validator
     * @param {InitInput} input - Init input
     * @param {number} retries - Number of retries
     * @returns {Promise<Validator>} New validator
     */
    async init(input: InitInput, retries: number | undefined = 25): Promise<Validator> {
        try {
            const operatorsInfo = await Promise.all(input.operatorIds.map(async (operatorId) => {
                const response = await fetch(`https://api.ssv.network/api/v4/prater/operators/${operatorId}`)
                const { public_key, dkg_address: ip } = await response.json() as SSVOperator
                return { id: operatorId, public_key, ip }
            }))

            const outputDir = "./data"

            const operatorsInfoPath = `${outputDir}/operators.json`
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
            fs.writeFileSync(operatorsInfoPath, JSON.stringify(operatorsInfo))
        
            const ceremonyOutputPath = `${outputDir}/ceremony-${Date.now()}` 
            if (!fs.existsSync(ceremonyOutputPath)) fs.mkdirSync(ceremonyOutputPath)

            const flags = [
                `--configPath ${this.configPath}`,
                `--operatorIDs ${input.operatorIds.join(",")}`,
                `--operatorsInfoPath ${operatorsInfoPath}`,
                `--outputPath ${ceremonyOutputPath}`,
                `--owner ${input.ownerAddress}`,
                `--nonce ${input.ownerNonce}`,
                `--withdrawAddress ${input.withdrawalAddress}`
            ]
    
            const command = `${this.cliPath} init ${flags.join(" ")}`
            await run(`${command}`)
            
            const depositFileName = fs.readdirSync(ceremonyOutputPath).find((file) => file.startsWith("deposit-"))
            const depositFilePath = `${ceremonyOutputPath}/${depositFileName}`
            const [deposit] = JSON.parse(fs.readFileSync(depositFilePath, "utf8"))
            const { deposit_data_root, pubkey, signature, withdrawal_credentials } = deposit
    
            const keysharesFileName = fs.readdirSync(ceremonyOutputPath).find((file) => file.startsWith("keyshares-"))
            const keysharesFilePath = `${ceremonyOutputPath}/${keysharesFileName}`
            const { payload } = JSON.parse(fs.readFileSync(`${keysharesFilePath}`, "utf8"))
            const shares = payload.sharesData
    
            return {
                depositDataRoot: `0x${deposit_data_root}`,
                publicKey: `0x${pubkey}`,
                operatorIds: input.operatorIds,
                shares: shares,
                signature: `0x${signature}`,
                withdrawalCredentials: `0x${withdrawal_credentials}`
            }
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            console.log(error)
            console.log(`Retrying init ${retries} more times`)
            await new Promise(resolve => setTimeout(resolve, 2500))
            return await this.init(input, retries - 1)
        }
    }

    /**
     * Reshare an existing validator
     * @param {ReshareInput} input - Reshare input
     * @param {number} retries - Number of retries
     * @returns {Promise<Reshare>} Reshared validator
     */
    async reshare(input: ReshareInput, retries: number | undefined = 25): Promise<Reshare> {
        try {
            const operatorsInfo = await Promise.all(input.operatorIds.map(async (operatorId) => {
                const response = await fetch(`https://api.ssv.network/v4/prater/operators/${operatorId}`)
                const { public_key, dkg_address: ip } = await response.json() as SSVOperator
                return { id: operatorId, public_key, ip }
            }))

            const outputDir = "./data"

            const operatorsInfoPath = `${outputDir}/operators.json`
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
            fs.writeFileSync(operatorsInfoPath, JSON.stringify(operatorsInfo))
        
            const ceremonyOutputPath = `${outputDir}/ceremony-${Date.now()}` 
            if (!fs.existsSync(ceremonyOutputPath)) fs.mkdirSync(ceremonyOutputPath)

            const flags = [
                `--configPath ${this.configPath}`,
                `--oldOperatorIDs ${input.oldOperatorIds.join(",")}`,
                `--operatorIDs ${input.operatorIds.join(",")}`,
                `--operatorsInfo ${JSON.stringify(operatorsInfo)}`,
                `--outputPath ${ceremonyOutputPath}`
            ]
    
            const command = `${this.cliPath} reshare ${flags.join(" ")}`
            await run(`${command}`)
    
            const keysharesFileName = fs.readdirSync(ceremonyOutputPath).find((file) => file.startsWith("keyshares-"))
            const keysharesFilePath = `${ceremonyOutputPath}/${keysharesFileName}`
            const { payload } = JSON.parse(fs.readFileSync(`${keysharesFilePath}`, "utf8"))
            const shares = payload.sharesData
    
            return {
                oldOperatorIds: input.oldOperatorIds,
                operatorIds: input.operatorIds,
                poolId: input.poolId,
                publicKey: input.publicKey,
                shares
            }
        } catch (error) {
            if (retries === 0) {
                throw error
            }
            console.log(error)
            console.log(`Retrying reshare ${retries} more times`)
            await new Promise(resolve => setTimeout(resolve, 2500))
            return await this.reshare(input, retries - 1)
        }
    }
}
