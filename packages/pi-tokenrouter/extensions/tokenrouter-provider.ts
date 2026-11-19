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
        id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        name: "Nemotron 3 Nano Omni (TokenRouter Free)",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 262144,
        maxTokens: 65536,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "stealth/union-alpha",
        name: "Union Alpha (TokenRouter)",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 1048576,
        maxTokens: 131072,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  console.log("[pi-tokenrouter] Registered 2 models (tokenrouter)");
}
