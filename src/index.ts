var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var Main = class extends import_koishi.Service {
  constructor(ctx, config) {
    super(ctx, "vits", true);
    this.config = config;
    if (config.proxy_agent) {
      this.http = ctx.http.extend({ proxyAgent: config.proxy_agent });
    }
    
    for (const x of config.command) {
      let command;
      if (config.command_name && config.command_name.trim() !== '') {
        command = ctx.command(`${config.command_name}.${x.name} <content:text>`, x.description);
      } else {
        command = ctx.command(`${x.name} <content:text>`, x.description);
      }
      
      command.action(async (_, content) => {
        if (!content) return "内容未输入。";
        if (/<.*\/>/gm.test(content)) return "输入的内容不是纯文本。";
        return await generate(this.http ?? ctx.http, content, x, config.api_key, config.api_url);
      });
    }
  }
  static {
    __name(this, "Main");
  }
  static inject = {
    required: ["http"]
  };
  http;
  async say(options) {
    const { vits_service_speaker, api_key, api_url } = this.config;
    const command = this.config.command.find(c => c.reference_id === vits_service_speaker) || this.config.command[0];
    return await generate(this.http ?? this.ctx.http, options.input, command, api_key, api_url);
  }
};
async function generate(http, input, x, key, api_url) {
  const params = {
    text: input,
    format: "wav",
    reference_id: x.reference_id
  };
  
  const url = api_url || "https://api.fish.audio/v1/tts";
  
  try {
    const res = await http.post(url, params, {
      headers: {
        "Authorization": `Bearer ${key}`
      }
    });
    return import_koishi.h.audio(res, "audio/wav");
  } catch (err) {
    if (http.isError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw err;
  }
}
__name(generate, "generate");
((Main2) => {
  Main2.Config = import_koishi.Schema.object({
    api_key: import_koishi.Schema.string().description("Fish Audio [API 令牌密钥](https://fish.audio/zh-CN/go-api/)").required(),
    api_url: import_koishi.Schema.string().description("Fish Audio API 地址").default("https://api.fish.audio/v1/tts"),
    command_name: import_koishi.Schema.string().description("指令名称").default(""),
    command: import_koishi.Schema.array(
      import_koishi.Schema.object({
        name: import_koishi.Schema.string().description("指令名").required(),
        description: import_koishi.Schema.string().description("指令的描述").default(""),
        reference_id: import_koishi.Schema.string().description("Fish Audio 参考标识，可从 Fish Audio 模型主页链接中取得，如 https://fish.audio/zh-CN/m/bcbb6d60721c44a489bc33dd59ce7cfc").required()
      })
    ).description("指令列表").default([
      {
        name: "say",
        description: "语音生成（流萤）",
        reference_id: "bcbb6d60721c44a489bc33dd59ce7cfc"
      }
    ]),
    vits_service_speaker: import_koishi.Schema.string().description("用于 VITS 服务的 Fish Audio 参考标识").default("bcbb6d60721c44a489bc33dd59ce7cfc"),
    proxy_agent: import_koishi.Schema.string().role("link").description("用于获取语音的代理。")
  });
})(Main || (Main = {}));
var src_default = Main;
