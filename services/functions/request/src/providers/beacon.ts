import { BeaconValidator } from "../interfaces/BeaconValidator.ts"
import { BeaconResponseData } from "../interfaces/BeaconResponseData.ts"

export class Beacon {
    public readonly beaconUrl: string

    constructor(beaconUrl: string) {
        this.beaconUrl = beaconUrl
    }

    async getValidators(publicKeys: string[], slot?: number) {
        const request = await Functions.makeHttpRequest({
            url: `${this.beaconUrl}/eth/v1/beacon/states/${slot || "finalized"}/validators?id=${publicKeys.join(",")}`
        })	
        if (request.error) throw new Error("Failed to get validators")
        const { data } = request.data as BeaconResponseData
        return data as BeaconValidator[]
    }
}