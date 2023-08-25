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
  source: fs.readFileSync(path.join(__dirname, 'API-request-source.js')).toString(),
  // Secrets can be accessed within the source code with `secrets.varName` (ie: secrets.apiKey). The secrets object can only contain string values.
  secrets: {
    // ethereumRpcUrl: process.env.ETHEREUM_RPC_URL ?? "",
    // ethereumBeaconRpcUrl: process.env.ETHEREUM_BEACON_RPC_URL ?? "",
  },
  // Per-node secrets objects assigned to each DON member. When using per-node secrets, nodes can only use secrets which they have been assigned.
  perNodeSecrets: [],
  // ETH wallet key used to sign secrets so they cannot be accessed by a 3rd party
  walletPrivateKey: process.env["PRIVATE_KEY"],
  // Args (string only array) can be accessed within the source code with `args[index]` (ie: args[0]).
  args: [
    "1616508000", // genesisTimestamp
    "1689541170", // previousReportTimestamp
    "1689627688", // reportTimestamp
    "9340689", // reportBlockNumber
    "1", // requestType
    "0x6b34d231b467fccebdc766187f7251795281dc26", // viewsAddress
    "0x0812a9fe", // getCompoundablePoolIds(uint256,uint256)
    "0x5d1e0780", // getDepositedPoolCount()
    "0x12c3456b", // getSweptBalance(uint256,uint256)
    "0xf6647134" // getValidatorPublicKeys(uint256,uint256)
  ],
  // Expected type of the returned value
  expectedReturnType: ReturnType.Buffer,
  // Redundant URLs which point to encrypted off-chain secrets
  secretsURLs: [],
}

module.exports = requestConfig