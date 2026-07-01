import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const CLINE_API_KEY = process.env.CLINE_API_KEY;

  if (!CLINE_API_KEY) {
    console.warn("[pi-cline-free] CLINE_API_KEY not set — `cline` provider will not be registered");
    return;
  }

  pi.registerProvider("cline", {
    name: "Cline (Free Models)",
    baseUrl: "https://api.cline.bot/api/v1",
    apiKey: CLINE_API_KEY,
    api: "openai-completions",
    models: [
      {
        id: "openrouter/owl-alpha",
        name: "Owl Alpha",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1048576,
        maxTokens: 262144,
      },
      {
        id: "nvidia/nemotron-3-ultra-550b-a55b:free",
        name: "Nemotron 3 Ultra 550B",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1000000,
        maxTokens: 65536,
      },
      {
        id: "nvidia/nemotron-3-super-120b-a12b:free",
        name: "Nemotron 3 Super 120B",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1000000,
        maxTokens: 262144,
      },
      {
        id: "google/gemma-4-26b-a4b-it:free",
        name: "Gemma 4 26B",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 32768,
      },
      {
        id: "google/gemma-4-31b-it:free",
        name: "Gemma 4 31B",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 8192,
      },
      {
        id: "nvidia/nemotron-3-nano-30b-a3b:free",
        name: "Nemotron 3 Nano 30B",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 256000,
        maxTokens: 8192,
      },
      {
        id: "openrouter/free",
        name: "Free Models Router",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 200000,
        maxTokens: 8192,
      },
      {
        id: "openai/gpt-oss-120b:free",
        name: "GPT-OSS 120B",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 131072,
        maxTokens: 131072,
      },
      {
        id: "liquid/lfm-2.5-1.2b-instruct:free",
        name: "LFM2.5 1.2B Instruct",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 32768,
        maxTokens: 8192,
      },
      {
        id: "nex-agi/nex-n2-pro:free",
        name: "Nex-N2-Pro",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 262144,
      },
      {
        id: "nvidia/nemotron-nano-12b-v2-vl:free",
        name: "Nemotron Nano 12B VL",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 128000,
      },
    ],
  });
}
