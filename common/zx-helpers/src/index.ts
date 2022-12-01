import { $, ProcessOutput } from 'zx'

async function getContainerPort(image: string, port: string) {
    const output = await $`docker port $(docker ps -a -q --filter ancestor=${image} --filter expose=${port} --format="{{.ID}}") ${port}`
    const path = parseStdout(output)
    return path.split(':')[1]
}

function parseStdout(output: ProcessOutput) {
    const { stdout } = output
    return stdout.replace('\n', '')
}

export { getContainerPort, parseStdout }
