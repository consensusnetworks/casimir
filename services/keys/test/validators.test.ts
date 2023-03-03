import { SSV } from '../src/index'

test('Create 2 SSV validator with 4 eligible operators', async function () {
    const dkgServiceUrl = 'http://0.0.0.0:8000'
    const groups = [[1, 2, 3, 4], [1, 2, 3, 4]]
    const ssv = new SSV({ dkgServiceUrl })
    const validators = []
    for (const group of groups) {  

        /** Mock the local DKG service in test mode */
        if (ssv.dkgService.serviceUrl.includes('0.0.0.0')) {
            console.log('Starting local DKG service...')
            await ssv.dkgService.start()
        }
                
        const validator = await ssv.createValidator({ operatorIds: group })
        validators.push(validator)

        /** Stop the local DKG service */
        if (ssv.dkgService.serviceUrl.includes('0.0.0.0')) {
            console.log('Stopping local DKG service...')
            await ssv.dkgService.stop()
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
    expect(validators.length).toBe(2)
})