import { $ } from 'zx'

void async function () {
    const dkgServiceUrl = 'http://0.0.0.0:8000'
    const groups = [[1, 2, 3, 4], [1, 2, 3, 4]]
    for (const group of groups) {  
        console.log(`Starting ceremony for operators: ${group.join(',')}`)
        await $`npx esno -r dotenv/config src/index.ts create-validator --dkgServiceUrl ${dkgServiceUrl} --operatorIds ${group.join(',')}`
        console.log('Completed ceremony...')

        if (group !== groups[groups.length - 1]) {
            console.log('Waiting for 5 seconds before starting the next ceremony...')
            await $`sleep 5`
        }
    }
}()