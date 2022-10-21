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
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var Iotex_exports = {};
__export(Iotex_exports, {
  IotexActionType: () => IotexActionType,
  IotexNetworkType: () => IotexNetworkType,
  IotexService: () => IotexService,
  newIotexService: () => newIotexService
});
module.exports = __toCommonJS(Iotex_exports);
var import_iotex_antenna = __toESM(require("iotex-antenna"));
var import__ = require("../index");
var IotexNetworkType = /* @__PURE__ */ ((IotexNetworkType2) => {
  IotexNetworkType2["Mainnet"] = "mainnet";
  IotexNetworkType2["Testnet"] = "testnet";
  return IotexNetworkType2;
})(IotexNetworkType || {});
var IotexActionType = /* @__PURE__ */ ((IotexActionType2) => {
  IotexActionType2["grantReward"] = "grantReward";
  IotexActionType2["claimFromRewardingFund"] = "claimFromRewardingFund";
  IotexActionType2["depositToRewardingFund"] = "depositToRewardingFund";
  IotexActionType2["candidateRegister"] = "candidateRegister";
  IotexActionType2["candidateUpdate"] = "candidateUpdate";
  IotexActionType2["stakeCreate"] = "stakeCreate";
  IotexActionType2["stakeRestake"] = "stakeRestake";
  IotexActionType2["stakeAddDeposit"] = "stakeAddDeposit";
  IotexActionType2["transfer"] = "transfer";
  IotexActionType2["stakeUnstake"] = "stakeUnstake";
  IotexActionType2["stakeWithdraw"] = "stakeWithdraw";
  IotexActionType2["execution"] = "execution";
  IotexActionType2["putPollResult"] = "putPollResult";
  IotexActionType2["StakeChangeCandidate"] = "stakeChangeCandidate";
  return IotexActionType2;
})(IotexActionType || {});
class IotexService {
  constructor(opt) {
    this.chain = import__.Chain.Iotex;
    this.network = opt.network || "mainnet" /* Mainnet */;
    this.chainId = "mainnet" /* Mainnet */ ? 4689 : 4690;
    this.provider = new import_iotex_antenna.default(opt.url, this.chainId, {
      signer: opt.signer,
      timeout: opt.timeout,
      apiToken: opt.apiToken
    });
  }
  deduceActionType(action) {
    const core = action.action.core;
    if (core === void 0)
      return null;
    const type = Object.keys(core).filter((k) => k !== void 0)[Object.keys(core).length - 2];
    return type;
  }
  async getBlocks(start, count) {
    if (start < 0 || count < 0) {
      throw new Error("start and count must be greater than 0");
    }
    if (start === 0) {
      start = 1;
    }
    if (count === 0) {
      count = 100;
    }
    const blocks = await this.provider.iotx.getBlockMetas({ byIndex: { start, count } });
    return blocks;
  }
  async getBlockActions(index, count) {
    const actions = await this.provider.iotx.getActions({
      byIndex: {
        start: index,
        count
      }
    });
    return actions.actionInfo;
  }
  async getCurrentBlock() {
    const { chainMeta } = await this.provider.iotx.getChainMeta({
      includePendingActions: false
    });
    const block = await this.provider.iotx.getBlockMetas({ byIndex: { start: parseInt(chainMeta.height), count: 1 } });
    return block;
  }
  async readableBlockStream() {
    const stream = await this.provider.iotx.streamBlocks({
      start: 1
    });
    return stream;
  }
  on(event, callback) {
    this.provider.iotx.streamBlocks({
      start: 1
    }).on("data", (data) => {
      callback(data);
    });
  }
  async getEvents(height) {
    const events = [];
    const block = await this.provider.iotx.getBlockMetas({ byIndex: { start: height, count: 1 } });
    const blockMeta = block.blkMetas[0];
    const blockEvent = {
      block: blockMeta.hash,
      chain: this.chain,
      network: this.network,
      provider: import__.Provider.Alchemy,
      type: import__.Event.Block,
      created_at: new Date(block.blkMetas[0].timestamp.seconds * 1e3).toISOString().replace("T", " ").replace("Z", ""),
      address: blockMeta.producerAddress,
      height: blockMeta.height,
      to_address: "",
      validator: "",
      duration: 0,
      validator_list: [],
      amount: 0,
      auto_stake: false
    };
    const numOfActions = block.blkMetas[0].numActions;
    if (numOfActions > 0) {
      const actions = await this.getBlockActions(height, numOfActions);
      const blockActions = actions.map((action) => {
        const actionCore = action.action.core;
        if (actionCore === void 0)
          return;
        const actionType = this.deduceActionType(action);
        if (actionType === null)
          return;
        const actionEvent = {
          chain: this.chain,
          network: this.network,
          provider: import__.Provider.Alchemy,
          type: actionType,
          created_at: new Date(action.timestamp.seconds * 1e3).toISOString().replace("T", " ").replace("Z", ""),
          address: blockMeta.producerAddress,
          height: blockMeta.height,
          to_address: "",
          validator: "",
          duration: 0,
          validator_list: [],
          amount: "0",
          auto_stake: false
        };
        if (actionType === "transfer" /* transfer */ && actionCore.transfer) {
          actionEvent.amount = parseInt(actionCore.transfer.amount).toString();
          actionEvent.to_address = actionCore.transfer.recipient;
          events.push(actionEvent);
        }
        if (actionType === "stakeCreate" /* stakeCreate */ && actionCore.stakeCreate) {
          actionEvent.amount = actionCore.stakeCreate.stakedAmount;
          actionEvent.validator = actionCore.stakeCreate.candidateName;
          actionEvent.auto_stake = actionCore.stakeCreate.autoStake;
          actionEvent.duration = actionCore.stakeCreate.stakedDuration;
          events.push(actionEvent);
        }
        if (actionType === "stakeAddDeposit" /* stakeAddDeposit */ && actionCore.stakeAddDeposit) {
          actionEvent.amount = actionCore.stakeAddDeposit.amount;
          events.push(actionEvent);
        }
        if (actionType === "execution" /* execution */ && actionCore.execution) {
          actionEvent.amount = actionCore.execution.amount;
          events.push(actionEvent);
        }
        if (actionType === "putPollResult" /* putPollResult */ && actionCore.putPollResult) {
          if (actionCore.putPollResult.candidates) {
            actionEvent.validator_list = actionCore.putPollResult.candidates.candidates.map((c) => c.address);
          }
          if (actionCore.putPollResult.height) {
            actionEvent.height = typeof actionCore.putPollResult.height === "string" ? parseInt(actionCore.putPollResult.height) : actionCore.putPollResult.height;
          }
          events.push(actionEvent);
        }
        if (actionType === "stakeChangeCandidate" /* StakeChangeCandidate */ && actionCore.stakeChangeCandidate) {
          actionEvent.validator = actionCore.stakeChangeCandidate.candidateName;
          events.push(actionEvent);
        }
        if (actionType === "stakeRestake" /* stakeRestake */ && actionCore.stakeRestake) {
          actionEvent.duration = actionCore.stakeRestake.stakedDuration;
          actionEvent.auto_stake = actionCore.stakeRestake.autoStake;
          events.push(actionEvent);
        }
        if (actionType === "candidateRegister" /* candidateRegister */ && actionCore.candidateRegister) {
          actionEvent.amount = actionCore.candidateRegister.stakedAmount;
          actionEvent.duration = actionCore.candidateRegister.stakedDuration;
          actionEvent.auto_stake = actionCore.candidateRegister.autoStake;
          actionEvent.validator = actionCore.candidateRegister.candidate.name;
          events.push(actionEvent);
        }
        if (actionType === "candidateUpdate" /* candidateUpdate */ && actionCore.candidateUpdate) {
          actionEvent.validator = actionCore.candidateUpdate.name;
          events.push(actionEvent);
        }
        if (actionType === "claimFromRewardingFund" /* claimFromRewardingFund */ && actionCore.claimFromRewardingFund) {
          actionEvent.amount = actionCore.claimFromRewardingFund.amount;
        }
        if (actionType === "depositToRewardingFund" /* depositToRewardingFund */ && actionCore.depositToRewardingFund) {
          actionEvent.amount = actionCore.depositToRewardingFund.amount;
          events.push(actionEvent);
        }
        return actionEvent;
      });
      events.push(...blockActions);
    }
    return {
      hash: blockMeta.hash,
      events
    };
  }
}
function newIotexService(opt) {
  return new IotexService(opt);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IotexActionType,
  IotexNetworkType,
  IotexService,
  newIotexService
});
