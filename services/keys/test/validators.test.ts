import { SSV } from '../src/index'

test('Create 1 SSV validator with 4 eligible operators', async function () {
    const dkgServiceUrl = 'http://testing:8000'
    const ssv = new SSV({ dkgServiceUrl })
    const operatorIds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 100))
    const validator = await ssv.createValidator({ operatorIds })
    console.log(validator)
})