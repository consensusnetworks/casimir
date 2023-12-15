import { run } from "@casimir/shell"
import fs from "fs"

/**
 * Check environment prerequisites
 */
void async function () {
    if (process.env.CI !== "true") {
        try {
            const submodules = fs.readFileSync(".gitmodules", "utf8")
            const submoduleDirs = submodules.match(/path = (.*)/g)?.map((path) => path.replace("path = ", ""))
            submoduleDirs?.forEach((dir) => {
                const content = fs.readdirSync(dir)
                if (!content.length) {
                    throw new Error("🚩 Missing ssh key for submodules")
                }
            })
        } catch (error) {
            console.error(error.message)
            throw new Error("🚩 Please add an ssh key for submodules (see https://github.com/consensusnetworks/casimir#prerequisites #1)")
        }

        try {
            const docker = await run("docker --version") as string
            const dockerSplit = docker.split(" ")
            const dockerNumber = dockerSplit[2]
            const dockerNumberSplit = dockerNumber.split(".")
            const dockerMajor = parseInt(dockerNumberSplit[0])
            if (dockerMajor < 24) {
                throw new Error("🚩 Incompatible docker version")
            }
        } catch (error) {
            console.error(error.message)
            throw new Error("🚩 Please install docker 24.x (see https://github.com/consensusnetworks/casimir#prerequisites #2)")
        }

        try {
            const go = await run("go version") as string
            if (!go.includes("1.20")) {
                throw new Error("🚩 Incompatible go version")
            }
        } catch (error) {
            console.error(error.message)
            throw new Error("🚩 Please install go v1.20.x (see https://github.com/consensusnetworks/casimir#prerequisites #3)")
        }

        try {
            const node = await run("node --version") as string
            const nodeLts = await run("source ~/.nvm/nvm.sh && nvm ls-remote --lts | grep 'Latest LTS' | tail -n 1 | awk '{print $2}'") as string
            if (!nodeLts.trim().includes(node.trim())) {
                throw new Error("🚩 Incompatible node version")
            }
        } catch (error) {
            console.error(error.message)
            throw new Error("🚩 Please install node LTS (see https://github.com/consensusnetworks/casimir#prerequisites #4)")
        }
    }
}()