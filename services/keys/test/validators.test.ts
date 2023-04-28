import { SSV } from '../src/index'

test('Create 2 SSV validator with 4 eligible operators', async function () {
    const dkgServiceUrl = 'http://0.0.0.0:3000'
    const groups = [[1, 2, 3, 4], [1, 2, 3, 4]]
    const ssv = new SSV({ dkgServiceUrl })
    const validators = await Promise.all(groups.map(async (group) => {
        console.log(`Starting ceremony for operators: ${group.join(',')}`)
        const validator = await ssv.createValidator({ operatorIds: group })
        console.log('Completed ceremony...')
        return validator
    }))
    expect(validators.length).toBe(2)
})