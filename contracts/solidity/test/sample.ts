import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Sample', function () {
  it('Should return the new greeting once it\'s changed', async function () {
    const Sample = await ethers.getContractFactory('Sample')
    const sample = await Sample.deploy('Hello, world!')
    await sample.deployed()

    expect(await sample.greet()).to.equal('Hello, world!')

    const setGreetingTx = await sample.setGreeting('Hola, mundo!')

    // wait until the transaction is mined
    await setGreetingTx.wait()

    expect(await sample.greet()).to.equal('Hola, mundo!')
  })
})