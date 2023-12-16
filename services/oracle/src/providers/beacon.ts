import { BeaconValidator } from "@casimir/types"

export class Beacon {
    public readonly beaconUrl: string
    private readonly auth?: string

    constructor(beaconUrl: string) {
        if (beaconUrl.includes("@")) {
            const [protocol, url] = beaconUrl.split("://")
            const [auth, host] = url.split("@")
            const [username, password] = auth.split(":")
            this.beaconUrl = `${protocol}://${host}`
            this.auth = `${username}:${password}`
        } else {
            this.beaconUrl = beaconUrl
        }
    }

    async getValidator(publicKey: string, slot?: number) {
        const url = `${this.beaconUrl}/eth/v1/beacon/states/${slot || "finalized"}/validators?id=${publicKey}`
        let requestInit: RequestInit = {}
        if (this.auth) {
            requestInit = {
                ...requestInit,
                headers: {
                    ...requestInit.headers,
                    "Authorization": `Basic ${Buffer.from(this.auth).toString("base64")}`
                }
            }
        }
        const request = await fetch(url, requestInit)
        const json = await request.json()
        return json.data?.[0] as BeaconValidator | undefined
    }
}