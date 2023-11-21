import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { firstUserDepositFixture, rewardsPostSecondUserDepositFixture, secondUserDepositFixture, thirdUserDepositFixture, rewardsPostThirdUserDepositFixture, simulationFixture, firstUserPartialWithdrawalFixture, fourthUserDepositFixture, sweepPostSecondUserDepositFixture, sweepPostThirdUserDepositFixture, beaconBalanceLossFixture, beaconBalanceRecoveryFixture, thirdUserFullWithdrawalFixture } from "./fixtures/shared"

describe("Integration", async function () {

    it("First user's 16.0 stake increases the total stake to 16.0", async function () {
        const { manager } = await loadFixture(firstUserDepositFixture)
        const stake = await manager.getTotalStake()
        expect(ethers.utils.formatEther(stake)).equal("16.0")
    })

    it("First user's 16.0 stake increases their stake to 16.0", async function () {
        const { manager, firstUser } = await loadFixture(firstUserDepositFixture)
        const stake = await manager.getUserStake(firstUser.address)
        expect(ethers.utils.formatEther(stake)).equal("16.0")
    })

    it("Second user's 24.0 stake completes the first pool with 32.0", async function () {
        const { manager, views } = await loadFixture(secondUserDepositFixture)
        const stakedPoolIds = await manager.getStakedPoolIds()
        expect(stakedPoolIds.length).equal(1)

        const firstPoolId = stakedPoolIds[0]
        const poolConfig = await views.getPoolConfig(firstPoolId)
        expect(poolConfig.publicKey).not.equal("0x")
        expect(poolConfig.operatorIds.length).equal(4)
    })

    it("Second user's 24.0 stake increases the total stake to 40.0", async function () {
        const { manager } = await loadFixture(secondUserDepositFixture)
        const stake = await manager.getTotalStake()
        expect(ethers.utils.formatEther(stake)).equal("40.0")
    })

    it("Second user's 24.0 stake increases their stake to 24.0", async function () {
        const { manager, secondUser } = await loadFixture(secondUserDepositFixture)
        const stake = await manager.getUserStake(secondUser.address)
        expect(ethers.utils.formatEther(stake)).equal("24.0")
    })

    it("Functions oracle reports an increase of 0.1 in total after fees", async function () {
        const { manager } = await loadFixture(rewardsPostSecondUserDepositFixture)
        const stake = await manager.getTotalStake()
        expect(ethers.utils.formatEther(stake)).equal("40.1")
    })

    it("First and second user's stake earns them 0.04 and 0.06", async function () {
        const { manager, firstUser, secondUser } = await loadFixture(rewardsPostSecondUserDepositFixture)
        const firstStake = await manager.getUserStake(firstUser.address)
        const secondStake = await manager.getUserStake(secondUser.address)
        expect(ethers.utils.formatEther(firstStake)).equal("16.04")
        expect(ethers.utils.formatEther(secondStake)).equal("24.06")
    })

    it("First pool's 0.1 is swept and compounded", async function () {
        const { manager } = await loadFixture(sweepPostSecondUserDepositFixture)
        const withdrawableBalance = await manager.getWithdrawableBalance()
        expect(ethers.utils.formatEther(withdrawableBalance)).equal("8.1")
    })

    it("Third user's 24.0 stake completes the second pool with 32.0", async function () {
        const { manager, views } = await loadFixture(thirdUserDepositFixture)
        const stakedPools = await manager.getStakedPoolIds()
        expect(stakedPools.length).equal(2)

        const secondPoolId = stakedPools[1]
        const poolConfig = await views.getPoolConfig(secondPoolId)
        expect(poolConfig.publicKey).not.equal("0x")
        expect(poolConfig.operatorIds.length).equal(4)
    })

    it("Third user's 24.0 stake increases the total stake to 64.1", async function () {
        const { manager } = await loadFixture(thirdUserDepositFixture)
        const stake = await manager.getTotalStake()
        expect(ethers.utils.formatEther(stake)).equal("64.1")
    })

    it("Third user's 24.0 stake increases their stake to 24.0", async function () {
        const { manager, thirdUser } = await loadFixture(thirdUserDepositFixture)
        const stake = await manager.getUserStake(thirdUser.address)
        expect(ethers.utils.formatEther(stake)).equal("24.0")
    })

    it("Functions oracle reports an increase of 0.2 in total after fees", async function () {
        const { manager } = await loadFixture(rewardsPostThirdUserDepositFixture)
        const stake = await manager.getTotalStake()
        expect(ethers.utils.formatEther(stake)).equal("64.3")
    })

    it("First, second, and third user's stake earns them ~0.09, ~0.135 and ~0.075", async function () {
        const { manager, firstUser, secondUser, thirdUser } = await loadFixture(rewardsPostThirdUserDepositFixture)
        const firstStake = await manager.getUserStake(firstUser.address)
        const secondStake = await manager.getUserStake(secondUser.address)
        const thirdStake = await manager.getUserStake(thirdUser.address)

        expect(ethers.utils.formatEther(firstStake)).equal("16.090046801872074882")
        expect(ethers.utils.formatEther(secondStake)).equal("24.135070202808112324")
        expect(ethers.utils.formatEther(thirdStake)).equal("24.074882995319812792")
    })

    it("First and second pool's 0.2 is swept and compounded", async function () {
        const { manager } = await loadFixture(sweepPostThirdUserDepositFixture)
        const withdrawableBalance = await manager.getWithdrawableBalance()
        expect(ethers.utils.formatEther(withdrawableBalance)).equal("0.3")
    })

    it("First user's 0.3 withdrawal decreases their stake to ~15.79", async function () {
        const { manager, firstUser, secondUser, thirdUser } = await loadFixture(firstUserPartialWithdrawalFixture)
        const firstStake = await manager.getUserStake(firstUser.address)
        const secondStake = await manager.getUserStake(secondUser.address)
        const thirdStake = await manager.getUserStake(thirdUser.address)

        expect(ethers.utils.formatEther(firstStake)).equal("15.790046801872074882")
        expect(ethers.utils.formatEther(secondStake)).equal("24.135070202808112324")
        expect(ethers.utils.formatEther(thirdStake)).equal("24.074882995319812792")
    })

    it("Fourth user's 72 stake completes the third and fourth pool with 72", async function () {
        const { manager, views } = await loadFixture(fourthUserDepositFixture)
        const stakedPools = await manager.getStakedPoolIds()
        expect(stakedPools.length).equal(4)

        const thirdPoolId = stakedPools[2]
        const thirdPoolConfig = await views.getPoolConfig(thirdPoolId)
        expect(thirdPoolConfig.publicKey).not.equal("0x")
        expect(thirdPoolConfig.operatorIds.length).equal(4)

        const fourthPoolId = stakedPools[3]
        const fourthPoolConfig = await views.getPoolConfig(fourthPoolId)
        expect(fourthPoolConfig.publicKey).not.equal("0x")
        expect(fourthPoolConfig.operatorIds.length).equal(4)
    })

    it("A loss is reported and brings the active stake below expected", async function () {
        const { manager } = await loadFixture(beaconBalanceLossFixture)
        const beaconBalance = await manager.latestBeaconBalance()
        expect(ethers.utils.formatEther(beaconBalance)).equal("126.0")
    })

    it("Gains are reported and bring the active stake back to expected", async function () {
        const { manager } = await loadFixture(beaconBalanceRecoveryFixture)
        const beaconBalance = await manager.latestBeaconBalance()
        expect(ethers.utils.formatEther(beaconBalance)).equal("128.0")
    })

    it("Third user full withdrawal is completed on exit report", async function () {
        const { manager, firstUser, secondUser, thirdUser, fourthUser } = 
            await loadFixture(thirdUserFullWithdrawalFixture)
        const stake = await manager.getTotalStake()
        const firstStake = await manager.getUserStake(firstUser.address)
        const secondStake = await manager.getUserStake(secondUser.address)
        const thirdStake = await manager.getUserStake(thirdUser.address)
        const fourthStake = await manager.getUserStake(fourthUser.address)

        expect(ethers.utils.formatEther(stake)).equal("111.925117004680187208")
        expect(ethers.utils.formatEther(firstStake)).equal("15.790046801872074882")
        expect(ethers.utils.formatEther(secondStake)).equal("24.135070202808112324")
        expect(ethers.utils.formatEther(thirdStake)).equal("0.0")
        expect(ethers.utils.formatEther(fourthStake)).equal("72.0")
    })

    it("Check more rewards and dust", async function () {
        const { manager, firstUser, secondUser, thirdUser, fourthUser } = await loadFixture(simulationFixture)
        const stake = await manager.getTotalStake()
        const firstStake = await manager.getUserStake(firstUser.address)
        const secondStake = await manager.getUserStake(secondUser.address)
        const thirdStake = await manager.getUserStake(thirdUser.address)
        const fourthStake = await manager.getUserStake(fourthUser.address)

        const line = "----------------------------------------"
        console.log(`${line}\n💿 Simulation results\n${line}`)
        console.log("🏦 Manager stake", ethers.utils.formatEther(stake))
        console.log("👤 First user stake", ethers.utils.formatEther(firstStake))
        console.log("👤 Second user stake", ethers.utils.formatEther(secondStake))
        console.log("👤 Third user stake", ethers.utils.formatEther(thirdStake))
        console.log("👤 Fourth user stake", ethers.utils.formatEther(fourthStake))
        const withdrawableBalance = await manager.getWithdrawableBalance()
        console.log("📦 Withdrawable balance", ethers.utils.formatEther(withdrawableBalance))
        const dust = stake.sub(firstStake.add(secondStake).add(thirdStake).add(fourthStake))
        if (dust !== ethers.utils.parseEther("0.0")) {
            console.log("🧹 Dust", ethers.utils.formatEther(dust))
        }
        console.log(line)
    })
})