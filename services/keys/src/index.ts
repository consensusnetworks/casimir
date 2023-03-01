import fs from 'fs'
import path from 'path'
import url from 'url'
import { CLI } from './providers/cli'
import { SSV } from './providers/ssv'
import { Validator } from '@casimir/types'

export { SSV }

/** 
 * Check if module is run directly 
 */
(async function isCLI() {
    const nodePath = path.resolve(process.argv[1])
    const modulePath = path.resolve(url.pathToFileURL(__filename).toString()).split(':')[1]
    if (nodePath === modulePath) {
        const cli = new CLI()
        const response = await cli.run()
        const { validator } = response

        if (validator && fs.existsSync(path.resolve(__dirname, './data/validator_store.json'))) {
            const validatorStore: Record<number, Validator> = JSON.parse(fs.readFileSync(path.resolve(__dirname, './data/validator_store.json')).toString())
            validatorStore[Date.now()] = validator
            fs.writeFileSync(path.resolve(__dirname, './data/validator_store.json'), JSON.stringify(validatorStore, null, 2))
        }
    }
})()