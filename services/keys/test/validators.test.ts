import { SSV } from '../src/index'

test('Create 2 SSV validator with 4 eligible operators', async function () {
    const dkgServiceUrl = 'http://0.0.0.0:8000'
    const groups = [[1, 2, 3, 4], [1, 2, 3, 4]]
    const ssv = new SSV({ dkgServiceUrl })
    const validators = []
    for (const group of groups) {  
        const validator = await ssv.createValidator({ operatorIds: group })
        validators.push(validator)
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
    expect(validators.length).toBe(2)
})