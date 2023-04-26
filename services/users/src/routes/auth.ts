import express from 'express'
import useDB from '../providers/db'
import Session from 'supertokens-node/recipe/session'
import useEthers from '../providers/ethers'
import { Account, LoginCredentials, User } from '@casimir/types'

const { verifyMessageSignature } = useEthers()
const { addUser, getNonce, getUser, upsertNonce } = useDB()
const router = express.Router()

router.post('/nonce', async (req: express.Request, res: express.Response) => {
    try {
        const { address } = req.body
        const nonce = await upsertNonce(address)
        if (nonce) {
            res.setHeader('Content-Type', 'text/plain')
            res.status(200)
            res.json({
                error: false,
                nonce
            })
        } else {
            res.status(404)
            res.send()
        }
    } catch (error) {
        console.log('error in /nonce :>> ', error)
        res.status(500)
        res.send()
    }
})

router.post('/login', async (req: express.Request, res: express.Response) => {
    try {
        const { body } = req
        const loginCredentials = body
        const { provider, address, currency, message, signedMessage } = loginCredentials

        const { parsedDomain, parsedNonce } = parseMessage(message)
        const verifyDomain = parsedDomain ? verifyMessageDomain(parsedDomain) : false        
        const verifyNonce = parsedNonce ? await verifyMessageNonce(address, parsedNonce) : false
        const verifySignature = verifyMessageSignature(loginCredentials)
        const verificationError = !verifyDomain ? 'domain' : !verifyNonce ? 'nonce' : !verifySignature ? 'signature' : false

        if (verificationError) {
            return res.status(422).json({
                error: true,
                message: `Invalid ${verificationError}.`,
            })
        } else {
            const user = await getUser(address)
            if (!user) {  // signup
                console.log('SIGNING UP!')
                const now = new Date().toISOString()
                const newUser = {
                    address,
                    createdAt: now,
                    updatedAt: now,
                } as User
                const account = {
                    address,
                    currency,
                    walletProvider: provider,
                } as Account

                const addUserResult = await addUser(newUser, account)

                if (addUserResult?.address !== address) {
                    res.setHeader('Content-Type', 'application/json')
                    res.status(500)
                    res.json({
                        error: true,
                        message: 'Problem creating new user',
                    })
                } else {
                    await Session.createNewSession(req, res, address)
                    res.setHeader('Content-Type', 'application/json')
                    res.status(200)
                    res.json({
                        error: false,
                        message: 'Sign Up Successful'
                    })
                }
            } else { // login
                console.log('LOGGING IN!')
                const response = verifyMessageSignature({ address, currency, message, signedMessage, provider })
                upsertNonce(address)
                response ? await Session.createNewSession(req, res, address) : null
                res.setHeader('Content-Type', 'application/json')
                res.status(200)
                res.json({
                    error: false,
                    message: response ? 'Login successful' : 'Login failed',
                })
            }
        }
    } catch (e) {
        console.log('CAUGHT ERROR IN /siwe: ', e)
    }
})

function parseMessage(msg: string) {
    const parsedDomain = parseDomain(msg)
    const parsedNonce = parseNonce(msg)
    return { parsedDomain, parsedNonce }
}

function parseNonce(msg: string) {
    return msg.split('Nonce:')[1].split('Issued At:')[0].trim()
}

function parseDomain(msg: string) {
    const uri = msg.split('URI:')[1].split('Version:')[0].trim()
    const parsedUri = uri.split('://')[1].split('/')[0]
    const domain = msg.split('wants you to sign in with your Ethereum account:')[0].trim()
    return domain === parsedUri ? domain : null
}

function verifyMessageDomain(domain: string): boolean {
    const stage = process.env.STAGE
    if (stage === 'dev') {
        return domain === 'localhost:3000'
    } else {
        return false
    }
}

async function verifyMessageNonce(address: string, msgNonce: string) : Promise<boolean> {
    const dbNonce = await getNonce(address)
    return msgNonce === dbNonce
}

export default router