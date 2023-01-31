import minimist from 'minimist'
import path from 'path'
import url from 'url'
import SSV from './providers/SSV'

export { SSV }

/** 
 * Run CLI when called directly 
 */
void async function runCLI () {
    const nodePath = path.resolve(process.argv[1])
    const modulePath = path.resolve(url.pathToFileURL(__filename).toString())
    if (nodePath === modulePath) {
        const argv = minimist(process.argv.slice(2))
        const { operatorIds, validatorCount } = argv
        const ssv = new SSV()
        const validators = await ssv.createValidators({ operatorIds, validatorCount })
        console.log(validators)
    }
}()