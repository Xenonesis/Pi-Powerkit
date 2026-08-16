import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.TOKENROUTER_API_KEY || "sk-tJbDBFyBReNvzfySJ8gRXDZqsDGgT03IqmXpcejlpdaPO9nW";

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
        id: "qwen/qwen3.8-max-free",
        name: "Qwen3.8 Max (Free)",
        reasoning: false,
        input: ["text"],
        contextWindow: 262144,  // Qwen3.8 max context (upstream rejects >262144)
        maxTokens: 65536,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  console.log("[pi-tokenrouter] Registered 1 model (qwen/qwen3.8-max-free)");
}