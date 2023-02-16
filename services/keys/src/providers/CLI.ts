import minimist from 'minimist'
import SSV from './SSV'

export default class CLI {
    async run() {
        const argv = minimist(process.argv.slice(2))
        const { operatorIds, validatorCount } = argv
        const ssv = new SSV()
        const validators = await ssv.createValidators({ operatorIds, validatorCount })
        console.log(validators)
    }
}