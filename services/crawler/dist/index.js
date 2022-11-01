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
var import_child_process = require("child_process");
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
  options;
  service;
  _start;
  last;
  head;
  signal;
  constructor(opt) {
    this.options = opt;
    this.service = null;
    this.last = 0;
    this.head = 0;
    this._start = 0;
    this.signal = new AbortController();
  }
  verbose(msg) {
    if (this.options.verbose) {
      console.log(msg);
    }
  }
  async setup() {
    this.verbose(`chain: ${this.options.chain}`);
    this.verbose(`network: ${this.options.network}`);
    this.verbose(`provider: ${this.options.provider}`);
    if (this.options.chain === "ethereum" /* Ethereum */) {
      const service = new import_Ethereum.EthereumService({ url: this.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_RPC || "http://localhost:8545" });
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
      this.service = new import_Iotex.IotexService({ url: this.options.serviceOptions?.url || "https://api.iotex.one:443", network: import_Iotex.IotexNetworkType.Mainnet });
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
          if (process.env.UPLOAD) {
          }
          this.verbose(ndjson);
        }
      });
      this.service.provider.on("error", (err) => {
        throw new Error(err.message);
      });
      return;
    }
    throw new Error("Unsupported chain");
  }
  async processIPC(msg) {
    const error = msg?.payload?.error;
    if (error) {
      console.log(error);
    }
    if (msg.action === "stop") {
      console.log("stopping");
      this.signal.abort();
    }
  }
  async start() {
    if (this.options.stream) {
      const signal = new AbortController();
      const child = (0, import_child_process.fork)("./src/stream.ts", [], { signal: signal.signal });
      child.on("message", this.processIPC);
      child.on("exit", (code) => {
        console.log(`child process exited with code ${code}`);
      });
      const cmd = {
        action: "start",
        options: this.options,
        service: this.service,
        payload: {
          start: this._start,
          last: this.last,
          head: this.head
        }
      };
      child.send(cmd);
    }
    this.verbose(`crawling from ${this._start} - ${this.head}`);
    if (this.service instanceof import_Ethereum.EthereumService) {
      for (let i = this._start; i <= this.head; i++) {
        const { block, events } = await this.service.getEvents(i);
        const ndjson = events.map((e) => JSON.stringify(e)).join("\n");
        this.verbose(ndjson);
      }
      return;
    }
    if (this.service instanceof import_Iotex.IotexService) {
      for (let i = this._start; i < this.head; i++) {
        const { hash, events } = await this.service.getEvents(i);
        const ndjson = events.map((e) => JSON.stringify(e)).join("\n");
        if (process.env.UPLOAD) {
        }
        this.verbose(ndjson);
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
    this.verbose(`last processed block: ${JSON.stringify(parseInt(event[0].height.toString()), null, 2)}`);
    return event[0];
  }
}
async function crawler(config) {
  const crawler2 = new Crawler({
    chain: config.chain,
    network: config.network,
    provider: config.provider,
    serviceOptions: config.serviceOptions,
    output: config?.output ?? `s3://${eventOutputBucket}`,
    verbose: config?.verbose ?? false,
    stream: config?.stream ?? false
  });
  await crawler2.setup();
  return crawler2;
}
if (process.argv[0].endsWith("ts-node")) {
  runInDev().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
async function runInDev() {
  const config = {
    chain: "ethereum" /* Ethereum */,
    network: "mainnet" /* Mainnet */,
    provider: "alchemy" /* Alchemy */,
    output: `s3://${eventOutputBucket}`,
    verbose: true,
    stream: true
  };
  const cc = await crawler(config);
  await cc.start();
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
