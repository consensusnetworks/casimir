import { ExecOptions, exec, execSync } from "child_process"
import { ObjectEncodingOptions } from "fs"

/**
 * Run any shell command in a child process and return a promise
 * @param command - The full command to run
 * @returns A promise that resolves when the command exits
 */
export async function run(command: string, options?: ObjectEncodingOptions & ExecOptions) {
    const child = exec(command, options)
    let data = ""
    return new Promise((resolve, reject) => {
        child.on("error", reject)
        child.stdout?.on("data", chunk => {
            process.stdout.write(chunk.toString())
            data += chunk.toString()
        })
        child.stderr?.on("data", chunk => {
            process.stdout.write(chunk.toString())
        })
        child.on("exit", () => {
            resolve(data)
        })
    })
}

/**
 * Retry run any shell command in a child process and return a promise
 * @param command - The full command to run
 * @param retriesLeft - Number of retries left (default: 5)
 * @returns A promise that resolves when the command exits
 */
export async function runRetry(command: string, retriesLeft: number | undefined = 25): Promise<unknown> {
    if (retriesLeft === 0) {
        throw new Error("Command failed after maximum retries")
    }
    try {
        return await run(command)
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log("Retrying command", command)
        return await runRetry(command, retriesLeft - 1)
    }
}

/**
 * Run any shell command synchronously in a child process
 * @param command - The full command to run
 * @returns The output of the command
 */
export function runSync(command: string) {
    return execSync(command).toString()
}