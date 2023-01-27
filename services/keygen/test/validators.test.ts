import KeyGen from '../src/index'

test('Create validators provides 2 SSV validators for 8 operators grouped by 4', async function () {    
    const keyCount = 2
    const operatorIds = Array.from({ length: 8 }, (_, i) => i + 175)
    const kg = new KeyGen()
    const keys = await kg.createKeys({ keyCount, operatorIds })
    console.log(keys)
    expect(keys.length).toBe(operatorIds.length / 4)
})