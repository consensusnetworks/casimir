import { run } from "@casimir/shell"
import fs from "fs"
import { promisify } from "util"

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)
const exists = promisify(fs.exists)
const rm = promisify(fs.rm)

/**
 * Clean all repository dependencies
 */
void async function () {

    const { workspaces } = JSON.parse(await readFile("package.json", "utf8"))
    const packageDirs: string[] = []
    for (const workspace of workspaces) {
        const baseDir = workspace.replace("/*", "")
        const packages = await readdir(baseDir)
        for (const pkg of packages) {
            const isNpm = await exists(`${baseDir}/${pkg}/package.json`)
            if (isNpm) {
                packageDirs.push(`${baseDir}/${pkg}/build`)
                packageDirs.push(`${baseDir}/${pkg}/dist`)
                packageDirs.push(`${baseDir}/${pkg}/node_modules`)
                packageDirs.push(`${baseDir}/${pkg}/scripts/.out`)
            }
        }
    }

    const submodules = await readFile(".gitmodules", "utf8")
    const submoduleDirs = submodules.match(/path = (.*)/g)?.map((path) => path.replace("path = ", "")) || []

    const items = ["node_modules", "package-lock.json"].concat(packageDirs, submoduleDirs)
    for (const item of items) {
        if (await exists(item)) {
            console.log("Removing", item)
            await rm(item, { recursive: true })
        }
    }
    console.log("Reinstalling dependencies")
    await run("npm i")
}()