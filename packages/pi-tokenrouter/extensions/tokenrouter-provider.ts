import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.TOKENROUTER_API_KEY;

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-tokenrouter] TOKENROUTER_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("tokenrouter", {
    name: "TokenRouter",
    baseUrl: "https://api.tokenrouter.com/v1",
    api: "openai-completions",
    apiKey: API_KEY,
    models: [
      {
        id: "deepseek/deepseek-v4-pro-0813-free",
        name: "DeepSeek V4 Pro 0813 (Free)",
        reasoning: true,
        input: ["text"],
        contextWindow: 1048576,  // DeepSeek V4 1M window (verified cold 200)
        maxTokens: 65536,
        compat: { supportsDeveloperRole: false },  // upstream rejects role:developer → use system
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "qwen/qwen3.8-max-free",
        name: "Qwen3.8 Max (Free)",
        reasoning: true,
        input: ["text"],
        contextWindow: 262144,  // Qwen3.8 max context (upstream rejects >262144)
        maxTokens: 65536,
        compat: { supportsDeveloperRole: false },  // upstream rejects role:developer → use system
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  console.log("[pi-tokenrouter] Registered 2 models (deepseek-v4-pro-0813-free, qwen3.8-max-free)");
}