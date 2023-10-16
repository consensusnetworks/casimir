export interface Event {
    // The chain which the event belongs to (e.g. iotex, ethereum)
    chain: "etheruem" | "iotex";
    // The network which the event was received on (e.g. mainnet, testnet)
    network: "mainnet" | "testnet" | "goerli";
    // The provider used to source the event (e.g. infura, consensus)
    provider: "alchemy" | "consensus";
    // The type of event (e.g. block, transaction)
    type: "block" | "transaction";
    // The height of the block the event belongs to
    height: number;
    // The block hash
    block: string;
    // The transaction hash
    transaction: string;
    // The timestamp of the event recieved by the blockchain (format: Modified ISO 8601 e.g. 2015-03-04 22:44:30.652)"
    receivedAt: string;
    // The sender's address
    sender: string;
    // The recipient's address
    recipient: string;
    // The sender's balance at the time of the event
    senderBalance: string;
    // The recipient's balance at the time of the event
    recipientBalance: string;
    // The amount transferred in the event
    amount: string;
    // The exchange price of the coin at the time of the event
    price: number;
}