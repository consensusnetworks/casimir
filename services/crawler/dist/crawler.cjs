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
var Crawler_exports = {};
__export(Crawler_exports, {
  Chain: () => Chain,
  crawler: () => crawler
});
module.exports = __toCommonJS(Crawler_exports);
var import_IotexService = require("./services/IotexService");
var import_events = __toESM(require("events"));
var import_fs = __toESM(require("fs"));
const EE = new import_events.default();
const defaultOutputLocation = "s3://";
var Chain = /* @__PURE__ */ ((Chain2) => {
  Chain2["Iotex"] = "iotex";
  Chain2["Accumulate"] = "accumulate";
  return Chain2;
})(Chain || {});
class Crawler {
  constructor(config) {
    this.config = config;
    this.init = new Date();
    this.service = null;
    this.running = false;
    this.EE = EE;
  }
  async _init() {
    if (this.config.chain === "iotex" /* Iotex */) {
      const service = await (0, import_IotexService.newIotexService)();
      this.service = service;
      if (this.config.verbose) {
        this.EE.on("init", () => {
          console.log(`Initialized crawler for: ${this.config.chain}`);
        });
      }
      this.EE.emit("init");
      return;
    }
    throw new Error("Unknown chain");
  }
  async start() {
    if (this.running) {
      throw new Error("Crawler is already running");
    }
    if (this.service == null) {
      throw new Error("Service is not initialized");
    }
    this.running = true;
    if (this.service instanceof import_IotexService.IoTexService) {
      const { chainMeta } = await this.service.getChainMetadata();
      const height = parseInt(chainMeta.height);
      const trips = Math.ceil(height / 1e3);
      if (!import_fs.default.existsSync("./_output")) {
        import_fs.default.mkdirSync("./_output");
      }
      for (let i = 0; i < trips; i++) {
        console.log("beep");
      }
      return;
    }
    throw new Error("not implemented yet");
  }
}
async function crawler(config) {
  const c = new Crawler({
    chain: (config == null ? void 0 : config.chain) ?? "iotex" /* Iotex */,
    output: (config == null ? void 0 : config.output) ?? defaultOutputLocation,
    verbose: (config == null ? void 0 : config.verbose) ?? false
  });
  await c._init();
  return c;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Chain,
  crawler
});
