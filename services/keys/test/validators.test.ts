import { SSV } from '../src/index'

test('Create 2 SSV validators from 8 eligible operators', async function () {    
    const operatorIds = Array.from({ length: 8 }, (_, i) => i + 1)
    const validatorCount = 2
    const ssv = new SSV()

    // Todo add mock keygen service
    const validators = await ssv.createValidators({ operatorIds, validatorCount })

    console.log(validators)
    expect(validators.length).toBe(validatorCount)
})