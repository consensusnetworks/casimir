import { ethers } from 'hardhat'
import { expect } from 'chai'
import useEthers from '../src/providers/ethers'

const { verifyMessage } = useEthers()

describe('Ethers provider', async function () {

    it('Verify message fails if missing params', async function () {
        const response = verifyMessage({ address: '', message: '', signedMessage: '' })
        expect(response).equal(false)
    })

    it('Verify message succeeds if user signs the message', async function () {
        const [ signer ] = await ethers.getSigners()
        // @ccali sign an arbitrary message like in wallet code and replace message values below to pass
        const response = verifyMessage({ address: signer.address, message: '', signedMessage: '' })
        expect(response).equal(true)
    })

})