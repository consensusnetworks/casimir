import { SSV } from '../src/index'

test('Create validators provides 2 SSV validators for 8 operators grouped by 4', async function () {    
    const operatorIds = Array.from({ length: 8 }, (_, i) => i + 175)
    const validatorCount = 2
    const ssv = new SSV()
    const validators = await ssv.createValidators({ operatorIds, validatorCount })
    console.log(validators)
    expect(validators.length).toBe(validatorCount)
})