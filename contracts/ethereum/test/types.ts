import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { TypesTest } from '../build/@types'

/** Fixture to deploy types test contract */
export async function deploymentFixture() {
    const [owner, receiver] = await ethers.getSigners()

    const typesTestFactory = await ethers.getContractFactory('TypesTest')
    const typesTest = await typesTestFactory.deploy() as TypesTest
    await typesTest.deployed()

    const addUint32Array = await typesTest.addUint32Array([1, 2, 3])
    await addUint32Array.wait()

    const addBytesArray = await typesTest.addBytesArray(['0x01', '0x02', '0x03'])
    await addBytesArray.wait()

    const addWithdrawal = await typesTest.addWithdrawals([
        {
            user: ethers.constants.AddressZero,
            amount: 0,
            period: 0
        },
        {
            user: ethers.constants.AddressZero,
            amount: 1,
            period: 1
        },
        {
            user: ethers.constants.AddressZero,
            amount: 2,
            period: 2
        }
    ])
    await addWithdrawal.wait()

    const deposit = await owner.sendTransaction({
        to: typesTest.address,
        value: ethers.utils.parseEther('1.0')
    })
    await deposit.wait()

    return { owner, receiver, typesTest }
}

describe('Types', async function () {
    it('Removes item from uint 32 array using a valid index', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const uint32Array = await typesTest.getUint32Array()
        const index = 1
        const item = uint32Array[index]
        const removeUint32ArrayItem = await typesTest.removeUint32(index)
        await removeUint32ArrayItem.wait()
        const updatedUint32Array = await typesTest.getUint32Array()
        expect(updatedUint32Array.length).equal(uint32Array.length - 1)
        expect(updatedUint32Array.indexOf(item)).equal(-1)
    })

    it('Fails to remove item from uint 32 array using an invalid index', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const uint32Array = await typesTest.getUint32Array()
        const removeUint32 = typesTest.removeUint32(uint32Array.length)
        await expect(removeUint32).to.be.revertedWith('Index out of bounds')
    })

    it('Fails to remove item from empty uint 32 array', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const uint32Array = await typesTest.getUint32Array()
        for (let i = uint32Array.length - 1; i >= 0; i--) {
            const removeUint32 = await typesTest.removeUint32(i)
            await removeUint32.wait()
        }
        const removeUint32 = typesTest.removeUint32(0)
        await expect(removeUint32).to.be.revertedWith('Can\'t remove from empty array')
    })

    it('Removes item from bytes array using a valid index', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const bytesArray = await typesTest.getBytesArray()
        const index = 1
        const item = bytesArray[index]
        const removeBytesArrayItem = await typesTest.removeBytes(index)
        await removeBytesArrayItem.wait()
        const updatedBytesArray = await typesTest.getBytesArray()
        expect(updatedBytesArray.length).equal(bytesArray.length - 1)
        expect(updatedBytesArray.indexOf(item)).equal(-1)
    })

    it('Fails to remove item from bytes array using an invalid index', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const bytesArray = await typesTest.getBytesArray()
        const removeBytes = typesTest.removeBytes(bytesArray.length)
        await expect(removeBytes).to.be.revertedWith('Index out of bounds')
    })

    it('Fails to remove item from empty bytes array', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const bytesArray = await typesTest.getBytesArray()
        for (let i = bytesArray.length - 1; i >= 0; i--) {
            const removeBytes = await typesTest.removeBytes(i)
            await removeBytes.wait()
        }
        const removeBytes = typesTest.removeBytes(0)
        await expect(removeBytes).to.be.revertedWith('Can\'t remove from empty array')
    })

    it('Removes item from withdrawal array using a valid index', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const withdrawals = await typesTest.getWithdrawals()
        const index = 1
        const item = withdrawals[index]
        const removeWithdrawal = await typesTest.removeWithdrawal(index)
        await removeWithdrawal.wait()
        const updatedWithdrawals = await typesTest.getWithdrawals()
        expect(updatedWithdrawals.length).equal(withdrawals.length - 1)
        expect(updatedWithdrawals.indexOf(item)).equal(-1)
    })

    it('Fails to remove item from withdrawal array using an invalid index', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const withdrawals = await typesTest.getWithdrawals()
        const removeWithdrawal = typesTest.removeWithdrawal(withdrawals.length)
        await expect(removeWithdrawal).to.be.revertedWith('Index out of bounds')
    })

    it('Fails to remove item from empty withdrawal array', async function () {
        const { typesTest } = await loadFixture(deploymentFixture)
        const withdrawals = await typesTest.getWithdrawals()
        for (let i = withdrawals.length - 1; i >= 0; i--) {
            const removeWithdrawal = await typesTest.removeWithdrawal(i)
            await removeWithdrawal.wait()
        }
        const removeWithdrawal = typesTest.removeWithdrawal(0)
        await expect(removeWithdrawal).to.be.revertedWith('Can\'t remove from empty array')
    })

    it('Sends ether to a valid address', async function () {
        const { receiver, typesTest } = await loadFixture(deploymentFixture)
        const balance = await ethers.provider.getBalance(receiver.address)
        const send = await typesTest.send(receiver.address, ethers.utils.parseEther('1.0'))
        await send.wait()
        const updatedBalance = await ethers.provider.getBalance(receiver.address)
        expect(updatedBalance).equal(balance.add(ethers.utils.parseEther('1.0')))
    })

    it('Fails to send ether with an invalid amount', async function () {
        const { receiver, typesTest } = await loadFixture(deploymentFixture)
        const failedSend = typesTest.send(receiver.address, ethers.utils.parseEther('2.0'))
        await expect(failedSend).to.be.revertedWith('Transfer failed')
    })
})