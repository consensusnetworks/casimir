import { CreateValidatorInput } from '../interfaces/CreateValidatorInput'
import { Validator } from '@casimir/types'

export class Ethdo {

    cliPath: string

    constructor(options: { cliPath: string }) {
        this.cliPath = options.cliPath
    }

    async createValidator(input: CreateValidatorInput): Promise<Validator> {
        console.log(input)

        return {
            depositDataRoot: '',
            publicKey: '',
            operatorIds: [],
            shares: '',
            signature: '',
            withdrawalCredentials: ''
        }
    }
    // async reshareValidator(input: ReshareValidatorInput, retriesLeft: number | undefined = 25): Promise<Validator> {},
    // async getDepositData(input: GetDepositDataInput, retriesLeft: number | undefined = 25): Promise<DepositData> {},
    // async getShares(ceremonyId: string, retriesLeft: number | undefined = 25): Promise<Shares> {},
    // async startKeygen(input: StartStartKeygenInput, retriesLeft: number | undefined = 25): Promise<string> {},
}