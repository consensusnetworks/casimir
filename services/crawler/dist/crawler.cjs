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
var import_client_s3 = require("@aws-sdk/client-s3");
var import_credential_provider_node = require("@aws-sdk/credential-provider-node");
var import_lib_storage = require("@aws-sdk/lib-storage");
var import_IotexService = require("./services/IotexService");
var import_events = __toESM(require("events"));
const EE = new import_events.default();
const defaultOutputLocation = "s3://casimir-etl-event-bucket-dev";
let s3 = null;
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
    s3 = await newS3Client();
    if (this.service instanceof import_IotexService.IoTexService) {
      const { chainMeta } = await this.service.getChainMetadata();
      const height = parseInt(chainMeta.height);
      const trips = Math.ceil(height / 1e3);
      for (let i = 0; i < trips; i++) {
        const blocks = await this.service.getBlockMetasByIndex(8e6, 1e3);
        if (blocks.length === 0)
          continue;
        for (const block of blocks) {
          const actions = await this.service.getActionsByIndex(block.height, block.num_of_actions);
          if (actions.length === 0)
            continue;
          const ndjson = actions.filter((a) => a.action.core !== void 0 && a.action.core.stakeCreate !== void 0).map((a) => {
            var _a;
            return (_a = this.service) == null ? void 0 : _a.convertToGlueSchema("create_stake", a);
          }).map((a) => JSON.stringify(a)).join("\n");
          if (ndjson.length === 0)
            continue;
          const destination = `${this.config.output}/${block.id}-events.json`;
          uploadToS3(destination, ndjson);
        }
      }
      return;
    }
    throw new Error("not implemented yet");
  }
}
async function newS3Client(opt) {
  if ((opt == null ? void 0 : opt.region) === void 0) {
    opt = {
      region: "us-east-2"
    };
  }
  if (opt.credentials === void 0) {
    opt = {
      credentials: await (0, import_credential_provider_node.defaultProvider)()
    };
  }
  const client = new import_client_s3.S3Client(opt);
  return client;
}
async function uploadToS3(destination, data) {
  if (!destination.startsWith("s3://")) {
    throw new Error("Invalid destination");
  }
  const [bucket, ...keys] = destination.split(":/")[1].split("/").splice(1);
  if (bucket === "")
    throw new Error("bucket name cannot be empty");
  if (keys.length === 0) {
    throw new Error("path cannot be empty");
  }
  console.log(`Uploading to ${keys}`);
  try {
    if (s3 === null) {
      throw new Error("s3 client is not initialized");
    }
    const upload = new import_lib_storage.Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: keys.join("/"),
        Body: data
      },
      leavePartsOnError: true
    });
    upload.on("httpUploadProgress", (progess) => {
      console.log(`Uploading ${progess.loaded}/${progess.total}`);
    });
    await upload.done();
  } catch (err) {
    throw new Error("Unable to upload to S3");
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
