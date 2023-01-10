import { expect } from 'chai'
import useValidator from '../src/providers/validator'

// Either manager or pool contract address
const withdrawalAddress = '0x4eAfaAC934dC9CB2288e188f61A27C28dABF693B'

describe('Validator', async function () {    

    it('Provides 4 operators', async function () {
        const { getValidatorInit } = useValidator()
        const { operators } = await getValidatorInit(withdrawalAddress)
        expect(operators.length).equal(4)
    })

})