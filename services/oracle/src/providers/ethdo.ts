import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Validator } from '@casimir/types'

export class Ethdo {

    cliPath: string

    constructor(options: { cliPath: string }) {
        this.cliPath = options.cliPath
    }
    // async createValidator(input: CreateValidatorInput, retriesLeft: number | undefined = 25): Promise<Validator> {},
    // async reshareValidator(input: ReshareValidatorInput, retriesLeft: number | undefined = 25): Promise<Validator> {},
    // async getDepositData(input: DepositDataInput, retriesLeft: number | undefined = 25): Promise<DepositData> {},
    // async getShares(ceremonyId: string, retriesLeft: number | undefined = 25): Promise<Shares> {},
    // async startKeygen(input: StartKeygenInput, retriesLeft: number | undefined = 25): Promise<string> {},
}