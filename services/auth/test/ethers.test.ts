import { ethers } from 'hardhat'
import { expect } from 'chai'
import useEthers from '../src/providers/ethers'

const { verifyMessage } = useEthers()

describe('Verify message', async function () {

    it('Login credentials fail if missing params', async function () {
        const response = verifyMessage({ address: '', message: '', signedMessage: '' })
        expect(response).equal(false)
    })

    it('Login credentials succeed if user signs the message', async function () {
        const [ signer ] = await ethers.getSigners()
        const message = 'unsigned message'
        const signedMessage = await signer.signMessage(message)
        const response = verifyMessage({ address: signer.address, message, signedMessage })
        expect(response).equal(true)
    })

    it('Login credentials fail if user does not sign message', async function () {
        const [ signer ] = await ethers.getSigners()
        const message = 'unsigned message'
        const signedMessage = 'signed message'
        const response = verifyMessage({ address: signer.address, message, signedMessage })
        expect(response).equal(false)
    })

})