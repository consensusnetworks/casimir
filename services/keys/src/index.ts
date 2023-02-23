import path from 'path'
import url from 'url'
import { CLI } from './providers/cli'
import { SSV } from './providers/ssv'

export { SSV }

/** 
 * Check if module is run directly 
 */
(function isCLI() {
    const nodePath = path.resolve(process.argv[1])
    const modulePath = path.resolve(url.pathToFileURL(__filename).toString()).split(':')[1]
    if (nodePath === modulePath) {
        const cli = new CLI()
        cli.run()
    }
})()