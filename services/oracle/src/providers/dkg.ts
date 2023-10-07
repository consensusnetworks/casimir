import fs from 'fs'
import { MOCK_OPERATORS } from '@casimir/env'
import { run } from '@casimir/shell'
import { InitInput } from '../interfaces/InitInput'
import { ReshareInput } from '../interfaces/ReshareInput'
import { Reshare, Validator } from '@casimir/types'
import { DkgOptions } from '../interfaces/DkgOptions'

export class Dkg {
    cliPath: string
    configPath: string

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
            const operators = MOCK_OPERATORS.filter((operator) => input.operatorIds.includes(operator.id))
            if (!fs.existsSync('./data')) fs.mkdirSync('./data')
            fs.writeFileSync('./data/operators.json', JSON.stringify(operators))
    
            const flags = [
                `--configPath ${this.configPath}`,
                `--operatorIDs ${input.operatorIds.join(',')}`,
                `--owner ${input.ownerAddress}`,
                `--nonce ${input.ownerNonce}`,
                `--withdrawAddress ${input.withdrawalAddress.split('0x')[1]}`
            ]
    
            const command = `${this.cliPath} init ${flags.join(' ')}`
            const response = await run(`${command}`) as string
    
            const depositFileLine = response.split('Writing deposit data json to file')[1]
            const depositFilePath = depositFileLine.split('{"path": "')[1].split('"}')[0]
            const [deposit] = JSON.parse(fs.readFileSync(depositFilePath, 'utf8'))
            const { deposit_data_root, pubkey, signature, withdrawal_credentials } = deposit
    
            const keysharesFileLine = response.split('Writing keyshares payload to file')[1]
            const keysharesFilePath = keysharesFileLine.split('{"path": "')[1].split('"}')[0]
            const { payload } = JSON.parse(fs.readFileSync(`${keysharesFilePath}`, 'utf8'))
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
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying init ${retries} more times`)
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
            const operators = MOCK_OPERATORS.filter((operator) => input.operatorIds.includes(operator.id))
            if (!fs.existsSync('./data')) fs.mkdirSync('./data')
            fs.writeFileSync('./data/operators.json', JSON.stringify(operators))
    
            const flags = [
                `--configPath ${this.configPath}`,
                `--oldOperatorIDs ${input.oldOperatorIds.join(',')}`,
                `--operatorIDs ${input.operatorIds.join(',')}`
            ]
    
            const command = `${this.cliPath} reshare ${flags.join(' ')}`
            const response = await run(`${command}`) as string
    
            const keysharesFileLine = response.split('Writing keyshares payload to file')[1]
            const keysharesFilePath = keysharesFileLine.split('{"path": "')[1].split('"}')[0]
            const { payload } = JSON.parse(fs.readFileSync(`${keysharesFilePath}`, 'utf8'))
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
            await new Promise(resolve => setTimeout(resolve, 2500))
            console.log(`Retrying reshare ${retries} more times`)
            return await this.reshare(input, retries - 1)
        }
    }
}
