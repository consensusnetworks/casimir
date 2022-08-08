"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var IotexService_exports = {};
__export(IotexService_exports, {
  IoTexService: () => IoTexService,
  IotexNetworkType: () => IotexNetworkType,
  newIotexService: () => newIotexService
});
module.exports = __toCommonJS(IotexService_exports);
var import_iotex_antenna = __toESM(require("iotex-antenna"));
var import_iotex_address_ts = require("@iotexproject/iotex-address-ts");
var IotexNetworkType = /* @__PURE__ */ ((IotexNetworkType2) => {
  IotexNetworkType2["Mainnet"] = "mainnet";
  IotexNetworkType2["Testnet"] = "testnet";
  return IotexNetworkType2;
})(IotexNetworkType || {});
class IoTexService {
  constructor(opt) {
    this.network = opt.network ?? "mainnet" /* Mainnet */;
    this.endpoint = this.network === "mainnet" /* Mainnet */ ? "https://api.iotex.one:443" : "https://api.testnet.iotex.one:443";
    this.client = new import_iotex_antenna.default(this.endpoint);
  }
  async getChainMetadata() {
    const meta = await this.client.iotx.getChainMeta({});
    return meta;
  }
  async getBlockMetasByIndex(start, count) {
    if (start < 0 || count < 0) {
      throw new Error("start and count must be greater than 0");
    }
    if (start === 0) {
      start = 1;
    }
    if (count === 0) {
      count = 100;
    }
    const { blkMetas } = await this.client.iotx.getBlockMetas({ byIndex: { start, count } });
    const meta = blkMetas.map((b) => {
      return {
        type: "block",
        id: b.hash,
        height: b.height,
        datestring: new Date(b.timestamp.seconds * 1e3).toISOString(),
        producer: b.producerAddress,
        amount: b.transferAmount,
        transaction_root: b.txRoot,
        num_of_actions: b.numActions
      };
    });
    return meta;
  }
  async getBlockMetaByHash(hash) {
    const metas = await this.client.iotx.getBlockMetas({
      byHash: {
        blkHash: hash
      }
    });
    return metas;
  }
  async getBlockLogs(hash) {
    const s = await this.client.iotx.getLogs({
      filter: {
        address: [],
        topics: []
      },
      byBlock: {
        blockHash: Buffer.from(hash, "hex")
      }
    });
    return s;
  }
  async getAccountActions(address) {
    const account = await this.client.iotx.getAccount({
      address
    });
    if (account.accountMeta === void 0) {
      return [];
    }
    const actions = await this.client.iotx.getActions({
      byAddr: {
        address: account.accountMeta.address,
        start: 1,
        count: 10
      }
    });
    return actions;
  }
  async getServerMetadata() {
    const meta = await this.client.iotx.getServerMeta({});
    return meta;
  }
  async getTxReceipt(actionHash) {
    const tx = await this.client.iotx.getReceiptByAction({ actionHash });
    return tx;
  }
  async getActionsByIndex(index, count) {
    const actions = await this.client.iotx.getActions({
      byIndex: {
        start: index,
        count
      }
    });
    if (actions.actionInfo === null) {
      throw new Error("Failed to get actions");
    }
    if (actions.actionInfo[0].action.core !== void 0) {
      const type = actions.actionInfo[0].action.core;
      if (type.stakeCreate !== void 0) {
        console.log("passed me");
        return actions.actionInfo.map((a) => this.convertToGlueSchema("stakeCreate", a));
      }
    }
    return [];
  }
  convertToGlueSchema(type, action) {
    var _a, _b;
    switch (type) {
      case "create_stake":
        if (((_a = action.action.core) == null ? void 0 : _a.stakeCreate) === void 0)
          throw new Error("Invalid action type");
        const s = (_b = action.action.core) == null ? void 0 : _b.stakeCreate;
        return {
          type: "create_stake",
          datestring: new Date(action.timestamp.seconds * 1e3).toISOString(),
          address: Buffer.from(action.action.senderPubKey).toString("hex"),
          staked_candidate: s.candidateName,
          staked_amout: s.stakedAmount,
          staked_duration: s.stakedDuration,
          auto_stake: action.action.core.stakeCreate.autoStake
        };
      default:
        console.log(action.action.core);
        throw new Error("Unknown action type");
    }
  }
  async getGasPrice() {
    const { gasPrice } = await this.client.iotx.suggestGasPrice({});
    return gasPrice;
  }
  convertEthToIotx(eth) {
    const add = (0, import_iotex_address_ts.from)(eth);
    return add.string();
  }
  convertIotxToEth(iotx) {
    const add = (0, import_iotex_address_ts.from)(iotx);
    return add.stringEth();
  }
}
async function newIotexService(opt) {
  return new IoTexService({
    network: (opt == null ? void 0 : opt.network) ?? "mainnet" /* Mainnet */
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IoTexService,
  IotexNetworkType,
  newIotexService
});
