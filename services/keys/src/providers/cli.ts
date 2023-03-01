import fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import { CommandArgs } from '../interfaces/CommandArgs'
import { camelCase } from '@casimir/string-helpers'
import { SSV } from './ssv'
import validatorStore from '../data/validator_store.json'
import { Validator } from '@casimir/types'

export class CLI {
    async run() {
        const { command, args } = this.getCommandArgs()

        if (!command || !Object.keys(this.commands).includes(command)) {
            throw new Error('No valid command provided')
        }

        return this.commands[command](args)
    }

    commands = {
        createValidator: async (args: CommandArgs) => {
            const { dkgServiceUrl, operatorIds, withdrawalAddress } = args
            const ssv = new SSV({ dkgServiceUrl })
            const validator = await ssv.createValidator({ operatorIds, withdrawalAddress })
            if (validatorStore) {
                (validatorStore as Record<number, Validator>)[Date.now()] = validator
                fs.writeFileSync(path.resolve(__dirname, '../data/validator_store.json'), JSON.stringify(validatorStore, null, 2))
            }
            return validator
        },
        help: () => {
            console.log('Commands:')
            console.log('create-validator')
        }
    }

    getCommandArgs() {
        const argv = minimist(process.argv.slice(2))
        const command = camelCase(argv._[0]) as keyof CLI['commands']
        const dkgServiceUrl = argv?.dkgServiceUrl || process.env.DKG_SERVICE_URL || 'http://0.0.0.0:8000'
        const operatorIds = argv?.operatorIds?.split(',').map((id: string) => parseInt(id)) || process.env.OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [1, 2, 3, 4]
        const withdrawalAddress = argv?.withdrawalAddress || process.env.WITHDRAWAL_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
        const args = { dkgServiceUrl, operatorIds, withdrawalAddress }
        return { command, args }
    }
}