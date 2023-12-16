export class Config {
    public readonly viewsAddress: string
    public readonly requestType: REQUEST_TYPE
    public readonly ethereumUrl: string
    public readonly ethereumBeaconUrl: string

    constructor() {
        const [viewsAddress, requestType] = args
        this.viewsAddress = viewsAddress
        this.requestType = parseInt(requestType)
        this.ethereumUrl = secrets.ethereumRpcUrl || "http://127.0.0.1:8545"
        this.ethereumBeaconUrl = secrets.ethereumBeaconRpcUrl || "http://127.0.0.1:5052"
    }
}

export enum REQUEST_TYPE {
    NONE,
    BALANCES,
    DETAILS
}