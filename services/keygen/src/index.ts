import minimist from 'minimist'
import path from 'path'
import url from 'url'
import KeyGen from './providers/KeyGen'

export default KeyGen

/** Run CLI when called directly */
void async function runCLI () {
    const nodePath = path.resolve(process.argv[1])
    const modulePath = path.resolve(url.pathToFileURL(__filename).toString())
    if (nodePath === modulePath) {
        const argv = minimist(process.argv.slice(2))
        const { keyCount, operatorIds } = argv
        const kg = new KeyGen()
        const keys = await kg.createKeys({ keyCount, operatorIds })
        console.log(keys)
    }
}()