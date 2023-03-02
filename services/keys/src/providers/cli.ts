import minimist from 'minimist'
import { CommandArgs } from '../interfaces/CommandArgs'
import { camelCase } from '@casimir/string-helpers'
import { SSV } from './ssv'
import { CLIOutput } from '../interfaces/CLIOutput'


export class CLI {
    async run() {
        const { command, args } = this.getCommandArgs()

        if (!command || !Object.keys(this.commands).includes(command)) {
            throw new Error('No valid command provided')
        }

        return await this.commands[command](args) as CLIOutput
    }

    commands = {
        createValidator: async (args: CommandArgs) => {
            const { dkgServiceUrl, operatorIds, withdrawalAddress } = args
            console.log('@casimir/keys')
            console.log('Command:\n')
            console.log('\tkeys create-validator')
            console.log(`\t  --dkgServiceUrl ${dkgServiceUrl}`)
            console.log(`\t  --operatorIds ${operatorIds}`)
            console.log(`\t  --withdrawalAddress ${withdrawalAddress}\n`)

            const ssv = new SSV({ dkgServiceUrl })
            
            /** Start the local DKG service in development mode */
            if (ssv.dkgService.serviceUrl.includes('0.0.0.0')) {
                console.log('Starting local DKG service...')
                await ssv.dkgService.start()
            }

            const validator = await ssv.createValidator({ operatorIds, withdrawalAddress })

            /** Stop up the local DKG service in development mode */
            if (ssv.dkgService.serviceUrl.includes('0.0.0.0')) {
                console.log('Stopping local DKG service...')
                await ssv.dkgService.stop()
            }

            return { status: 200, validator }
        },
        help: () => {
            console.log('@casimir/keys')
            console.log('Usage: keys <command> [options]')
            console.log('Commands:\n')
            console.log('\tcreate-validator')
            console.log('\t  --dkgServiceUrl')
            console.log('\t  --operatorIds')
            console.log('\t  --withdrawalAddress\n')
            console.log('\thelp\n')
            
            return { status: 200 }
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