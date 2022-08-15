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
var src_exports = {};
__export(src_exports, {
  Chain: () => Chain,
  crawler: () => crawler
});
module.exports = __toCommonJS(src_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_credential_provider_node = require("@aws-sdk/credential-provider-node");
var import_lib_storage = require("@aws-sdk/lib-storage");
var import_IotexService = require("./providers/IotexService");
var import_events = __toESM(require("events"));
var import_signal_exit = __toESM(require("signal-exit"));
const defaultEventBucket = "casimir-etl-event-bucket-dev";
const manifestBucket = "casimir-crawler-manifest";
const manifestFile = "manifest.json";
const EE = new import_events.default();
let s3 = null;
var Chain = /* @__PURE__ */ ((Chain2) => {
  Chain2["Iotex"] = "iotex";
  return Chain2;
})(Chain || {});
class Crawler {
  constructor(config) {
    this.config = config;
    this.service = null;
    this.EE = EE;
    this.manifest = {
      init: new Date()
    };
    this.signalOnExit();
  }
  async prepare() {
    if (this.config.chain === "iotex" /* Iotex */) {
      const service = await (0, import_IotexService.newIotexService)();
      this.service = service;
      this.manifest.service = service;
      this.manifest.chain = "iotex" /* Iotex */;
      if (this.config.verbose) {
        this.EE.on("init", () => {
          console.log(`Initialized crawler for: ${this.config.chain}`);
        });
      }
      this.EE.emit("init");
      const manifest = await this.getCrawlerManifest();
      if (manifest !== void 0) {
        if (this.config.verbose) {
          console.log("Retrieved crawler manifest");
          this.manifest = manifest;
        }
      }
      return;
    }
    throw new Error("UnknownChain: chain is not supported");
  }
  async getCrawlerManifest() {
    if (s3 === null)
      s3 = await newS3Client();
    try {
      const get = new import_client_s3.GetObjectCommand({
        Bucket: manifestBucket,
        Key: manifestFile
      });
      const { $metadata, Body } = await s3.send(get);
      if ($metadata.httpStatusCode === 200 && Body !== void 0) {
        const data = await JSON.parse(Body.toString());
        return data;
      }
      return;
    } catch (e) {
      if (e.Code === "NoSuchBucket") {
        return;
      }
    }
  }
  async setCrawlerManifest(manifest) {
    if (s3 === null)
      s3 = await newS3Client();
    const bucketList = new import_client_s3.ListBucketsCommand({});
    const { Buckets, $metadata } = await s3.send(bucketList);
    if ($metadata.httpStatusCode !== 200 || Buckets === void 0)
      throw new Error("FailedGetBucketList: unable to get bucket list");
    const bucketExists = Buckets.find((b) => b.Name === b);
    if (bucketExists === void 0) {
      const newBucket = new import_client_s3.CreateBucketCommand({
        Bucket: manifestBucket
      });
      const { $metadata: $metadata2 } = await s3.send(newBucket);
      if ($metadata2.httpStatusCode !== 200)
        throw new Error("FailedCreateBucket: unable to create bucket");
    }
    const upload = new import_client_s3.PutObjectCommand({
      Bucket: manifestBucket,
      Key: manifestFile,
      Body: JSON.stringify(manifest)
    });
    const data = await s3.send(upload);
    if (data.$metadata.httpStatusCode !== 200)
      throw new Error("FailedUploadManifest: unable to upload manifest");
    return;
  }
  signalOnExit() {
    (0, import_signal_exit.default)((code, signal2) => {
      this.manifest.stopped = new Date();
      console.log(JSON.stringify(this.manifest));
    });
  }
  async start() {
    if (this.service == null) {
      throw new Error("NullService: service is not initialized");
    }
    if (s3 === null)
      s3 = await newS3Client();
    if (this.service instanceof import_IotexService.IotexService) {
      const { chainMeta } = await this.service.getChainMetadata();
      const height = parseInt(chainMeta.height);
      const trips = Math.ceil(height / 1e3);
      for (let i = 0; i < trips; i++) {
        console.log(`Starting trip ${i + 1} of ${trips}`);
        const blocks = await this.service.getBlockMetasByIndex(i * 1e3, 1e3);
        if (blocks.length === 0)
          continue;
        for (const b of blocks) {
          const actions = await this.service.getActionsByIndex(b.height, b.num_of_actions);
          if (actions.length === 0)
            continue;
          const ndjson = actions.map((a) => JSON.stringify(a)).join("\n");
          const key = `${b.id}-events.json`;
          console.log(key);
        }
      }
      return;
    }
    throw new Error("not implemented yet");
  }
  async stop() {
    this.manifest.stopped = new Date();
    await this.setCrawlerManifest(this.manifest);
  }
  on(event, cb) {
    if (event !== "block")
      throw new Error("InvalidEvent: event is not supported");
    if (typeof cb !== "function")
      throw new Error("InvalidCallback: callback is not a function");
    if (this.service === null)
      throw new Error("NullService: service is not initialized");
    if (this.service instanceof import_IotexService.IotexService) {
      this.service.readableBlockStream().then((s) => {
        s.on("data", (b) => {
          cb(b);
        });
        s.on("error", (e) => {
          throw e;
        });
      });
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
    throw new Error("InvalidDestination: output destination must be an s3 bucket");
  }
  const [bucket, ...keys] = destination.split(":/")[1].split("/").splice(1);
  if (bucket === "")
    throw new Error("EmptyBucketName: bucket name cannot be empty");
  if (keys.length === 0) {
    throw new Error("EmptyKey: key cannot be empty");
  }
  console.log(`uploading to ${keys}`);
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
    await upload.done();
  } catch (err) {
    throw new Error("Unable to upload to S3");
  }
}
async function crawler(config) {
  const c = new Crawler({
    chain: (config == null ? void 0 : config.chain) ?? "iotex" /* Iotex */,
    output: (config == null ? void 0 : config.output) ?? `s3://${defaultEventBucket}`,
    verbose: (config == null ? void 0 : config.verbose) ?? false
  });
  await c.prepare();
  return c;
}
async function run() {
  const supercrawler = await crawler({
    chain: "iotex" /* Iotex */,
    verbose: true
  });
  supercrawler.on("block", (block) => {
    console.log(block);
  });
}
run();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Chain,
  crawler
});
