import express from "express"
import useDB from "../providers/db"
import Session from "supertokens-node/recipe/session"
import { verifySession } from "supertokens-node/recipe/session/framework/express"
import { SessionRequest } from "supertokens-node/framework/express"
import useEthers from "../providers/ethers"
import { Account, User } from "@casimir/types"

const { verifyMessageSignature } = useEthers()
const { addUser, getNonce, getUserByAddress, upsertNonce } = useDB()
const router = express.Router()

router.post("/nonce", async (req: express.Request, res: express.Response) => {
    try {
        const { address } = req.body
        const nonce = await upsertNonce(address)
        if (nonce) {
            res.setHeader("Content-Type", "text/plain")
            res.status(200)
            res.json({
                error: false,
                message: "Nonce retrieved",
                data: nonce
            })
        }
    } catch (error: any) {
        res.status(500)
        res.json({
            error: true,
            message: error.message || "Error getting nonce"
        })
    }
})

router.post("/login", async (req: express.Request, res: express.Response) => {
    try {
        const { body } = req
        const loginCredentials = body
        const { provider, address, currency, message, signedMessage, pathIndex } = loginCredentials
        const { parsedDomain, parsedNonce } = parseMessage(message)
        const verifyDomain = parsedDomain ? verifyMessageDomain(parsedDomain) : false
        const verifyNonce = parsedNonce ? await verifyMessageNonce(address, parsedNonce) : false
        const verifySignature = verifyMessageSignature(loginCredentials)
        const verificationError = !verifyDomain ? "domain" : !verifyNonce ? "nonce" : !verifySignature ? "signature" : false
        if (verificationError) {
            return res.status(422).json({
                error: true,
                message: `Invalid ${verificationError}.`,
            })
        } else {
            const user = await getUserByAddress(address)
            if (!user) {  // signup
                console.log("SIGNING UP!")
                const now = new Date().toISOString()
                const newUser = {
                    address,
                    createdAt: now,
                    updatedAt: now,
                    walletProvider: provider,
                } as User
                const account = {
                    address,
                    currency,
                    walletProvider: provider,
                    pathIndex,
                } as Account

                const addUserResult = await addUser(newUser, account)
                if (addUserResult?.address !== address) {
                    res.setHeader("Content-Type", "application/json")
                    res.status(500)
                    res.json({
                        error: true,
                        message: "Problem creating new user",
                    })
                } else {
                    const id = addUserResult?.id.toString() as string
                    await Session.createNewSession(req, res, id)
                    res.setHeader("Content-Type", "application/json")
                    res.status(200)
                    res.json({
                        error: false,
                        message: "Sign Up Successful"
                    })
                }
            } else { // login
                console.log("LOGGING IN!")
                const response = verifyMessageSignature({ address, currency, message, signedMessage, provider })
                upsertNonce(address)
                const user = await getUserByAddress(address)
                const userId = user?.id.toString() as string
                response ? await Session.createNewSession(req, res, userId) : null
                res.setHeader("Content-Type", "application/json")
                res.status(200)
                res.json({
                    error: false,
                    message: response ? "Login successful" : "Login failed",
                })
            }
        }
    } catch (error: any) {
        console.log("error in /login :>> ", error)
        res.status(500)
        res.json({
            error: true,
            message: error.message || "Error logging in"
        })
    }
})

function parseDomain(msg: string) {
    const uri = msg.split("URI:")[1].split("Version:")[0].trim()
    const parsedUri = uri.split("://")[1].split("/")[0]
    const domain = msg.split("wants you to sign in with your Ethereum account:")[0].trim()
    return domain === parsedUri ? domain : null
}

function parseMessage(msg: string) {
    const parsedDomain = parseDomain(msg)
    const parsedNonce = parseNonce(msg)
    return { parsedDomain, parsedNonce }
}

function parseNonce(msg: string) {
    return msg.split("Nonce:")[1].split("Issued At:")[0].trim()
}

function verifyMessageDomain(domain: string): boolean {
    const url = domain.includes("localhost") ? `http://${domain}` : `https://${domain}`
    if (process.env.WEB_URL) return url === process.env.WEB_URL
    return url === "http://localhost:3001"
}

async function verifyMessageNonce(address: string, msgNonce: string) : Promise<boolean> {
    try {
        const dbNonce = await getNonce(address)
        return msgNonce === dbNonce
    } catch (error) {
        throw new Error("Problem verifying message nonce")
    }
}

export default router