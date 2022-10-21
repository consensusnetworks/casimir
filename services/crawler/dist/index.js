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
var src_exports = {};
__export(src_exports, {
  Chain: () => Chain,
  Event: () => Event,
  Network: () => Network,
  Provider: () => Provider,
  crawler: () => crawler,
  eventOutputBucket: () => eventOutputBucket
});
module.exports = __toCommonJS(src_exports);
var import_Iotex = require("./providers/Iotex");
var import_Ethereum = require("./providers/Ethereum");
var import_helpers = require("@casimir/helpers");
var Chain = /* @__PURE__ */ ((Chain2) => {
  Chain2["Ethereum"] = "ethereum";
  Chain2["Iotex"] = "iotex";
  return Chain2;
})(Chain || {});
var Event = /* @__PURE__ */ ((Event2) => {
  Event2["Block"] = "block";
  Event2["Transaction"] = "transaction";
  Event2["Deposit"] = "deposit";
  return Event2;
})(Event || {});
var Provider = /* @__PURE__ */ ((Provider2) => {
  Provider2["Alchemy"] = "alchemy";
  return Provider2;
})(Provider || {});
var Network = /* @__PURE__ */ ((Network2) => {
  Network2["Mainnet"] = "mainnet";
  Network2["Testnet"] = "testnet";
  return Network2;
})(Network || {});
const eventOutputBucket = "casimir-etl-event-bucket-dev";
class Crawler {
  constructor(opt) {
    this.options = opt;
    this.service = null;
    this.last = 0;
    this.head = 0;
    this._start = 0;
  }
  verbose(msg) {
    if (this.options.verbose) {
      console.log(msg);
    }
  }
  async setup() {
    var _a, _b;
    this.verbose(`chain: ${this.options.chain}`);
    this.verbose(`network: ${this.options.network}`);
    this.verbose(`provider: ${this.options.provider}`);
    if (this.options.chain === "ethereum" /* Ethereum */) {
      const service = new import_Ethereum.EthereumService({ url: ((_a = this.options.serviceOptions) == null ? void 0 : _a.url) || process.env.PUBLIC_ETHEREUM_RPC_URL || "http://localhost:8545" });
      this.service = service;
      const lastEvent = await this.getLastProcessedEvent();
      const last = lastEvent ? parseInt(lastEvent.height.toString()) : 0;
      const current = await this.service.getCurrentBlock();
      this._start = last === 0 ? 0 : this.last + 1;
      this.last = last;
      this.head = current.number;
      return;
    }
    if (this.options.chain === "iotex" /* Iotex */) {
      this.service = await (0, import_Iotex.newIotexService)({ url: ((_b = this.options.serviceOptions) == null ? void 0 : _b.url) || "https://api.iotex.one:443", network: import_Iotex.IotexNetworkType.Mainnet });
      const lastEvent = await this.getLastProcessedEvent();
      const currentBlock = await this.service.getCurrentBlock();
      const currentHeight = currentBlock.blkMetas[0].height;
      const last = lastEvent !== null ? lastEvent.height : 0;
      this._start = last === 0 ? 0 : this.last + 1;
      this.head = currentHeight;
      this.last = last;
      return;
    }
    throw new Error("Unsupported chain");
  }
  async stream() {
    if (this.service instanceof import_Ethereum.EthereumService) {
      this.verbose("streaming etheruem blocks");
      this.service.provider.on("block", async (b) => {
        if (this.service instanceof import_Ethereum.EthereumService) {
          const block = await this.service.getBlock(b);
          const event = this.service.toEvent(block);
          this.verbose(`block: ${b}`);
          const ndjson = JSON.stringify(event);
          await (0, import_helpers.uploadToS3)({
            bucket: eventOutputBucket,
            key: `${block.hash}-events.json`,
            data: ndjson
          }).finally(() => {
            this.verbose(`uploaded ${block.hash} - height: ${block.number}`);
          });
        }
      });
      this.service.provider.on("error", (err) => {
        throw new Error(err.message);
      });
      return;
    }
    throw new Error("Unsupported chain");
  }
  async start() {
    this.verbose(`crawling blocjchain from ${this.start} - ${this.head}`);
    if (this.service instanceof import_Ethereum.EthereumService) {
      for (let i = this._start; i <= this.head; i++) {
        const { block, events } = await this.service.getEvents(i);
        const ndjson = events.map((e) => JSON.stringify(e)).join("\n");
        await (0, import_helpers.uploadToS3)({
          bucket: eventOutputBucket,
          key: `${block}-events.json`,
          data: ndjson
        }).finally(() => {
          this.verbose(`uploaded ${block}-events.json`);
        });
      }
    }
    if (this.service instanceof import_Iotex.IotexService) {
      for (let i = this._start; i < this.head; i++) {
        const { hash, events } = await this.service.getEvents(i);
        const ndjson = events.map((e) => JSON.stringify(e)).join("\n");
        await (0, import_helpers.uploadToS3)({
          bucket: eventOutputBucket,
          key: `${hash}-event.json`,
          data: ndjson
        }).finally(() => {
          if (this.options.verbose) {
            console.log(`uploaded events for block ${hash}`);
          }
        });
      }
      return;
    }
    throw new Error("Unsupported chain");
  }
  async getLastProcessedEvent() {
    if (this.options.chain === void 0) {
      throw new Error("chain is undefined");
    }
    const event = await (0, import_helpers.queryAthena)(`SELECT * FROM "casimir_etl_database_dev"."casimir_etl_event_table_dev" where chain = '${this.options.chain}' ORDER BY height DESC limit 1`);
    if (event === null)
      return null;
    this.verbose(`last processed event: ${JSON.stringify(event, null, 2)}`);
    return event[0];
  }
}
async function crawler(config) {
  const crawler2 = new Crawler({
    chain: config.chain,
    network: config.network,
    provider: config.provider,
    serviceOptions: config.serviceOptions,
    output: (config == null ? void 0 : config.output) ?? `s3://${eventOutputBucket}`,
    verbose: (config == null ? void 0 : config.verbose) ?? false,
    stream: (config == null ? void 0 : config.stream) ?? false
  });
  await crawler2.setup();
  return crawler2;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Chain,
  Event,
  Network,
  Provider,
  crawler,
  eventOutputBucket
});
