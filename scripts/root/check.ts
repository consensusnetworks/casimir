import { run } from "@casimir/shell"
import fs from "fs"

/**
 * Check environment prerequisites
 */
void async function () {
  if (process.env.CI !== "true") {
    const docker = await run("docker --version") as string
    try {
      const dockerSplit = docker.split(" ")
      const dockerNumber = dockerSplit[2]
      const dockerNumberSplit = dockerNumber.split(".")
      const dockerMajor = parseInt(dockerNumberSplit[0])
      if (dockerMajor < 24) {
        throw new Error("🚩 Incompatible docker version")
      }
    } catch (error) {
      console.error(error.message)
      throw new Error("🚩 Please install docker 24.x (see https://github.com/consensusnetworks/casimir#prerequisites #1)")
    }

    const submodules = fs.readFileSync(".gitmodules", "utf8")
    const submoduleDirs = submodules.match(/path = (.*)/g)?.map((path) => path.replace("path = ", ""))
    if (submoduleDirs) {
      try {
        for (const dir of submoduleDirs) {
          const content = fs.readdirSync(dir)
          if (!content.length) {
            throw new Error("🚩 Missing ssh key for submodules")
          }
        }
      } catch (error) {
        console.error(error.message)
        throw new Error("🚩 Please add an ssh key for submodules (see https://github.com/consensusnetworks/casimir#prerequisites #2)")
      }
    }

    const go = await run("go version") as string
    try {
      const goSplit = go.split(" ")
      const goNumber = goSplit[2]
      const goNumberSplit = goNumber.split(".")
      const goMajor = parseInt(goNumberSplit[0])
      const goMinor = parseInt(goNumberSplit[1])
      if (goMajor < 1 || goMinor < 18) {
        throw new Error("🚩 Incompatible go version")
      }
    } catch (error) {
      console.error(error.message)
      throw new Error("🚩 Please install go v1.18.x (see https://github.com/consensusnetworks/casimir#prerequisites #3)")
    }

    try {
      const node = await run("node --version") as string
      if (!node.includes("v18")) {
        throw new Error("🚩 Incompatible node version")
      }
    } catch (error) {
      console.error(error.message)
      throw new Error("🚩 Please install node v18.x (see https://github.com/consensusnetworks/casimir#prerequisites #4)")
    }
  }
}()