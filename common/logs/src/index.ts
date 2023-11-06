import fs from "fs"

export function getStartBlock(blockLogPath: string) {
    if (fs.existsSync(blockLogPath)) {
        return parseInt(fs.readFileSync(blockLogPath, "utf8"))
    }
}

export function updateStartBlock(blockLogPath: string, blockNumber: number) {
    fs.writeFileSync(blockLogPath, blockNumber.toString())
}

export function updateExecutionLog(executionLogPath: string, log: string) {
    fs.appendFileSync(executionLogPath, `${log}\n`)
}

export function updateErrorLog(errorLogPath: string, log: string) {
    fs.appendFileSync(errorLogPath, `${log}\n`)
}