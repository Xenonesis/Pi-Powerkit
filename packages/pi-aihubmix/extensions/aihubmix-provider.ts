import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.AIHUBMIX_API_KEY;

const MODELS = [
    {
      id: "coding-glm-5.2-free",
      name: "Coding GLM-5.2 Free",
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 65536
    },
    {
      id: "coding-kimi-k3-free",
      name: "Coding Kimi K3 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    },
    {
      id: "gemini-3.5-flash-lite-free",
      name: "Gemini 3.5 Flash Lite Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "gemini-3.6-flash-free",
      name: "Gemini 3.6 Flash Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    },
    {
      id: "gpt-oss-20b-free",
      name: "GPT-OSS 20B Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "nemotron-nano-9b-v2-free",
      name: "Nemotron Nano 9B V2 Free",
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "laguna-m.1-free",
      name: "Laguna M.1 Free",
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 256000,
      maxTokens: 32768
    },
    {
      id: "nemotron-3-ultra-550b-a55b-free",
      name: "Nemotron 3 Ultra 550B Free",
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1000000,
      maxTokens: 65536
    },
    {
      id: "nemotron-3-nano-30b-a3b-free",
      name: "Nemotron 3 Nano 30B Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "gemma-4-26b-a4b-it-free",
      name: "Gemma 4 26B Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 262144,
      maxTokens: 32768
    },
    {
      id: "gpt-5.5-free",
      name: "GPT-5.5 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 272000,
      maxTokens: 65536
    },
    {
      id: "xiaomi-mimo-v2-omni-free",
      name: "Xiaomi MiMo V2 Omni Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    {
      id: "xiaomi-mimo-v2-pro-free",
      name: "Xiaomi MiMo V2 Pro Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    {
      id: "xiaomi-mimo-v2.5-free",
      name: "Xiaomi MiMo V2.5 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    {
      id: "xiaomi-mimo-v2.5-pro-free",
      name: "Xiaomi MiMo V2.5 Pro Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    {
      id: "coding-minimax-m2.7-free",
      name: "Coding MiniMax M2.7 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 256000,
      maxTokens: 65536
    },
    {
      id: "coding-glm-5.1-free",
      name: "Coding GLM-5.1 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    },
    {
      id: "coding-glm-5-free",
      name: "Coding GLM-5 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    },
    {
      id: "coding-glm-5-turbo-free",
      name: "Coding GLM-5 Turbo Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    },
    {
      id: "coding-minimax-m2.5-free",
      name: "Coding MiniMax M2.5 Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 256000,
      maxTokens: 65536
    },
    {
      id: "gemini-3-flash-preview-free",
      name: "Gemini 3 Flash Preview Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "mimo-v2-flash-free",
      name: "MiMo V2 Flash Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    {
      id: "kimi-for-coding-free",
      name: "Kimi for Coding Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "k2.6-code-preview-free",
      name: "K2.6 Code Preview Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    },
    {
      id: "qwen3.6-plus-preview-free",
      name: "Qwen 3.6 Plus Preview Free",
      reasoning: false,
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 16384
    }
];

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-aihubmix] AIHUBMIX_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("aihubmix", {
    name: "Aihubmix Free Models",
    api: "openai-completions",
    baseUrl: "https://aihubmix.com/v1",
    apiKey: API_KEY,
    models: MODELS
  });
}
