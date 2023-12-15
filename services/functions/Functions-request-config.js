const fs = require("fs")
const path = require("path")

// Loads environment variables from .env.enc file (if it exists)
require("@chainlink/env-enc").config()

const Location = {
    Inline: 0,
    Remote: 1,
}

const CodeLanguage = {
    JavaScript: 0,
}

const ReturnType = {
    uint: "uint256",
    uint256: "uint256",
    int: "int256",
    int256: "int256",
    string: "string",
    bytes: "Buffer",
    Buffer: "Buffer",
}

// Configure the request by setting the fields below
const requestConfig = {
    // Location of source code (only Inline is currently supported)
    codeLocation: Location.Inline,
    // Code language (only JavaScript is currently supported)
    codeLanguage: CodeLanguage.JavaScript,
    // String containing the source code to be executed
    source: fs.readFileSync(path.join(__dirname, "API-request-source.js")).toString(),
    // Secrets can be accessed within the source code with `secrets.varName` (ie: secrets.apiKey). The secrets object can only contain string values.
    secrets: {
        ethereumRpcUrl: process.env.ETHEREUM_RPC_URL ?? "",
        ethereumBeaconRpcUrl: process.env.ETHEREUM_BEACON_RPC_URL ?? "",
    },
    // Per-node secrets objects assigned to each DON member. When using per-node secrets, nodes can only use secrets which they have been assigned.
    perNodeSecrets: [],
    // ETH wallet key used to sign secrets so they cannot be accessed by a 3rd party
    walletPrivateKey: process.env.PRIVATE_KEY ?? "",
    // Args (string only array) can be accessed within the source code with `args[index]` (ie: args[0]).
    args: [
        "0x394042CBB8bF5444766496897982A5CDd01d5099", // viewsAddress
        "0x0812a9fe", // getCompoundablePoolIds(uint256,uint256)
        "0x91cae538", // getStakedPoolCount()
        "0x05601fe6", // getStakedPoolPublicKeys(uint256,uint256)
        "0xca25993f", // getStakedPoolStatuses(uint256,uint256)
        "0x12c3456b", // getSweptBalance(uint256,uint256)
        "0" // requestType
    ],
    // Expected type of the returned value
    expectedReturnType: ReturnType.Buffer,
    // Redundant URLs which point to encrypted off-chain secrets
    secretsURLs: [],
}

module.exports = requestConfig