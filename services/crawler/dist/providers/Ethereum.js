"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Ethereum_exports = {};
__export(Ethereum_exports, {
  EthereumService: () => EthereumService
});
module.exports = __toCommonJS(Ethereum_exports);
var import_ethers = require("ethers");
var import__ = require("../index");
const ContractsOfInterest = {
  BeaconDepositContract: {
    hash: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    abi: ["event DepositEvent (bytes pubkey, bytes withdrawal_credentials, bytes amount, bytes signature, bytes index)"]
  }
};
class EthereumService {
  chain;
  network;
  provider;
  contractsOfInterest;
  constructor(opt) {
    this.chain = import__.Chain.Ethereum;
    this.network = opt.network || "mainnet";
    this.provider = new import_ethers.ethers.providers.JsonRpcProvider({
      url: opt.url
    });
    this.contractsOfInterest = ContractsOfInterest;
  }
  parseLog(log) {
    const abi = ContractsOfInterest.BeaconDepositContract.abi;
    const contractInterface = new import_ethers.ethers.utils.Interface(abi);
    const parsedLog = contractInterface.parseLog(log);
    const args = parsedLog.args.slice(-1 * parsedLog.eventFragment.inputs.length);
    const output = {};
    parsedLog.eventFragment.inputs.forEach((key, index) => {
      output[key.name] = args[index];
    });
    return output;
  }
  async getBlock(s) {
    const block = await this.provider.getBlock(s);
    return block;
  }
  toEvent(b) {
    const event = {
      chain: this.chain,
      network: this.network,
      provider: import__.Provider.Alchemy,
      type: import__.Event.Block,
      height: b.number,
      block: b.hash,
      created_at: new Date(b.timestamp * 1e3).toISOString().replace("T", " ").replace("Z", ""),
      address: b.miner,
      gasUsed: b.gasUsed.toString(),
      gasLimit: b.gasLimit.toString()
    };
    if (b.baseFeePerGas) {
      event.baseFee = import_ethers.ethers.BigNumber.from(b.baseFeePerGas).toString();
      const burntFee = import_ethers.ethers.BigNumber.from(b.gasUsed).mul(import_ethers.ethers.BigNumber.from(b.baseFeePerGas));
      event.burntFee = burntFee.toString();
    }
    return event;
  }
  async getEvents(height) {
    const events = [];
    const block = await this.provider.getBlockWithTransactions(height);
    const blockEvent = {
      chain: this.chain,
      network: this.network,
      provider: import__.Provider.Alchemy,
      type: import__.Event.Block,
      height: block.number,
      block: block.hash,
      created_at: new Date(block.timestamp * 1e3).toISOString().replace("T", " ").replace("Z", ""),
      address: block.miner,
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString()
    };
    if (block.baseFeePerGas) {
      blockEvent.baseFee = import_ethers.ethers.BigNumber.from(block.baseFeePerGas).toString();
      const burntFee = import_ethers.ethers.BigNumber.from(block.gasUsed).mul(import_ethers.ethers.BigNumber.from(block.baseFeePerGas));
      blockEvent.burntFee = burntFee.toString();
    }
    events.push(blockEvent);
    if (block.transactions.length === 0) {
      return {
        block: block.hash,
        events
      };
    }
    for await (const tx of block.transactions) {
      const txEvent = {
        chain: this.chain,
        network: this.network,
        provider: import__.Provider.Alchemy,
        type: import__.Event.Transaction,
        height: block.number,
        block: block.hash,
        transaction: tx.hash,
        address: tx.from,
        created_at: new Date(block.timestamp * 1e3).toISOString().replace("T", " ").replace("Z", ""),
        amount: import_ethers.ethers.utils.formatEther(tx.value.toString()),
        gasUsed: block.gasUsed.toString()
      };
      if (tx.to) {
        txEvent.to_address = tx.to;
      }
      if (tx.gasLimit) {
        txEvent.gasLimit = tx.gasLimit.toString();
      }
      events.push(txEvent);
      const receipts = await this.provider.getTransactionReceipt(tx.hash);
      if (receipts.logs.length === 0) {
        continue;
      }
      for (const log of receipts.logs) {
        if (log.address === ContractsOfInterest.BeaconDepositContract.hash) {
          const parsedLog = this.parseLog(log);
          const deposit = {
            chain: this.chain,
            network: this.network,
            provider: import__.Provider.Alchemy,
            type: import__.Event.Deposit,
            block: block.hash,
            transaction: log.transactionHash,
            created_at: new Date(block.timestamp * 1e3).toISOString().replace("T", " ").replace("Z", ""),
            address: log.address,
            height: block.number,
            amount: parsedLog.amount,
            gasLimit: block.gasLimit.toString()
          };
          if (tx.to) {
            deposit.to_address = tx.to;
          }
          events.push(deposit);
        }
      }
    }
    return {
      block: block.hash,
      events
    };
  }
  async getCurrentBlock() {
    const height = await this.provider.getBlockNumber();
    return await this.provider.getBlock(height);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EthereumService
});
