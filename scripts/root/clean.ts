import { run } from '@casimir/helpers'
import fs from 'fs'

/**
 * Clean all repository dependencies
 */
void async function () {

    const { workspaces } = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const packageDirs: string[] = []
    for (const workspace of workspaces) {
        const packages = fs.readdirSync(workspace.replace('/*', ''))
        for (const pkg of packages) {
            const isNpm = fs.existsSync(`${workspace.replace('*', '')}/${pkg}/package.json`)
            if (isNpm) {
                packageDirs.push(workspace.replace('*', `${pkg}/build`))
                packageDirs.push(workspace.replace('*', `${pkg}/dist`))
                packageDirs.push(workspace.replace('*', `${pkg}/node_modules`))
                packageDirs.push(workspace.replace('*', `${pkg}/scripts/.out`))
            }
        }
    }

    const submodules = fs.readFileSync('.gitmodules', 'utf8')
    const submoduleDirs = submodules.match(/path = (.*)/g)?.map((path) => path.replace('path = ', ''))

    await run(`npx rimraf ${packageDirs.join(' ')} ${submoduleDirs?.join(' ')} node_modules package-lock.json`)
    await run('npm i --foreground-scripts')
}()