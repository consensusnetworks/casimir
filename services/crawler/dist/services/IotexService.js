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
  IotexNetworkType: () => IotexNetworkType,
  IotexService: () => IotexService,
  newIotexService: () => newIotexService
});
module.exports = __toCommonJS(IotexService_exports);
var import_iotex_antenna = __toESM(require("iotex-antenna"));
var import_iotex_address_ts = require("@iotexproject/iotex-address-ts");
const IOTEX_CORE = "http://localhost:14014";
var IotexNetworkType = /* @__PURE__ */ ((IotexNetworkType2) => {
  IotexNetworkType2["Mainnet"] = "mainnet";
  IotexNetworkType2["Testnet"] = "testnet";
  return IotexNetworkType2;
})(IotexNetworkType || {});
var IotexActionType = /* @__PURE__ */ ((IotexActionType2) => {
  IotexActionType2["transfer"] = "transfer";
  IotexActionType2["grantReward"] = "grant_reward";
  IotexActionType2["createStake"] = "create_stake";
  IotexActionType2["stakeAddDeposit"] = "stake_add_deposit";
  IotexActionType2["execution"] = "execution";
  IotexActionType2["putPollResult"] = "put_poll_result";
  IotexActionType2["stakeWithdraw"] = "stake_withdraw";
  IotexActionType2["StakeChangeCandidate"] = "stake_change_candidate";
  IotexActionType2["stakeRestake"] = "stake_restake";
  return IotexActionType2;
})(IotexActionType || {});
class IotexService {
  constructor(opt) {
    this.provider = opt.provider || IOTEX_CORE;
    this.chainId = opt.chainId;
    this.client = new import_iotex_antenna.default(opt.provider, opt.chainId, {
      signer: opt.signer,
      timeout: opt.timeout,
      apiToken: opt.apiToken
    });
  }
  async getChainMetadata() {
    const meta = await this.client.iotx.getChainMeta({});
    return meta;
  }
  async getServerMetadata() {
    const meta = await this.client.iotx.getServerMeta({});
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
  convertEthToIotx(eth) {
    const add = (0, import_iotex_address_ts.from)(eth);
    return add.string();
  }
  convertIotxToEth(iotx) {
    const add = (0, import_iotex_address_ts.from)(iotx);
    return add.stringEth();
  }
  async getAccountActions(address, count) {
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
        count: count || 100
      }
    });
    return actions;
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
    const s = actions.actionInfo.map((action) => {
      const core = action.action.core;
      if (core === void 0)
        return;
      const type = Object.keys(core).filter((k) => k !== void 0)[Object.keys(core).length - 2];
      return this.convertToGlueSchema(type, action);
    });
    return s;
  }
  convertToGlueSchema(type, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    const core = action.action.core;
    if (core === void 0)
      return;
    switch (type) {
      case "grantReward":
        return {
          type: "grant_reward" /* grantReward */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          block_hash: action.blkHash,
          reward_type: ((_a = core.grantReward) == null ? void 0 : _a.type) ?? ""
        };
      case "transfer":
        return {
          type: "transfer" /* transfer */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          payload: typeof ((_b = core.transfer) == null ? void 0 : _b.payload) === "string" ? core.transfer.payload : core.transfer !== void 0 ? Buffer.from(core.transfer.payload).toString("hex") : "",
          recipient: (_c = core.transfer) == null ? void 0 : _c.recipient,
          amount: ((_d = core.transfer) == null ? void 0 : _d.amount) ?? ""
        };
      case "stakeCreate":
        return {
          type: "create_stake" /* createStake */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          staked_candidate: (_e = core == null ? void 0 : core.stakeCreate) == null ? void 0 : _e.candidateName,
          staked_amount: (_f = core.stakeCreate) == null ? void 0 : _f.stakedAmount,
          staked_duration: (_g = core.stakeCreate) == null ? void 0 : _g.stakedDuration,
          auto_stake: (_h = core.stakeCreate) == null ? void 0 : _h.autoStake
        };
      case "stakeAddDeposit":
        return {
          type: "stake_add_deposit" /* stakeAddDeposit */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          amount: (_i = core.stakeAddDeposit) == null ? void 0 : _i.amount,
          payload: ((_j = core.stakeAddDeposit) == null ? void 0 : _j.payload) !== void 0 ? Buffer.from((_k = core.stakeAddDeposit) == null ? void 0 : _k.payload).toString("hex") : "",
          bucket_index: (_l = core.stakeAddDeposit) == null ? void 0 : _l.bucketIndex
        };
      case "execution":
        return {
          type: "execution" /* execution */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          contract: (_m = core.execution) == null ? void 0 : _m.contract,
          amount: (_n = core.execution) == null ? void 0 : _n.amount,
          data: ((_o = core.execution) == null ? void 0 : _o.data) !== void 0 ? Buffer.from(core.execution.data).toString("hex") : ""
        };
      case "putPollResult":
        return {
          type: "put_poll_result" /* putPollResult */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          candidates: ((_q = (_p = core.putPollResult) == null ? void 0 : _p.candidates) == null ? void 0 : _q.candidates.map((c) => c.address)) ?? []
        };
      case "stakeWithdraw":
        return {
          type: "stake_withdraw" /* stakeWithdraw */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          bucket_index: (_r = core.stakeWithdraw) == null ? void 0 : _r.bucketIndex,
          payload: ((_s = core.stakeWithdraw) == null ? void 0 : _s.payload) !== void 0 ? Buffer.from(core.stakeWithdraw.payload).toString("hex") : ""
        };
      case "stakeChangeCandidate":
        return {
          type: "stake_change_candidate" /* StakeChangeCandidate */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          candidate: (_t = core.stakeChangeCandidate) == null ? void 0 : _t.candidateName,
          bucket_index: (_u = core.stakeChangeCandidate) == null ? void 0 : _u.bucketIndex,
          payload: ((_v = core.stakeChangeCandidate) == null ? void 0 : _v.payload) !== void 0 ? Buffer.from(core.stakeChangeCandidate.payload).toString("hex") : ""
        };
      case "stakeRestake":
        return {
          type: "stake_restake" /* stakeRestake */,
          date: new Date(action.timestamp.seconds * 1e3).toISOString(),
          payload: ((_w = core.stakeRestake) == null ? void 0 : _w.payload) !== void 0 ? Buffer.from(core.stakeRestake.payload).toString("hex") : "",
          auto_stake: (_x = core.stakeRestake) == null ? void 0 : _x.autoStake,
          staked_duration: (_y = core.stakeRestake) == null ? void 0 : _y.stakedDuration,
          bucket_index: (_z = core.stakeRestake) == null ? void 0 : _z.bucketIndex
        };
      default:
        console.log(type);
    }
  }
}
async function newIotexService(opt) {
  return new IotexService({
    provider: (opt == null ? void 0 : opt.provider) ?? "https://api.iotex.one:443",
    chainId: (opt == null ? void 0 : opt.chainId) ?? 1
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IotexNetworkType,
  IotexService,
  newIotexService
});
