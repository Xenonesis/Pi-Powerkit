import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.XIAOMI_API_KEY;

const MODELS = [
    {
      id: "mimo-v2.5",
      name: "MiMo V2.5",
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    },
    {
      id: "mimo-v2.5-pro",
      name: "MiMo V2.5 Pro",
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1048576,
      maxTokens: 131072
    }
];

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-xiaomi] XIAOMI_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("xiaomi", {
    name: "Xiaomi",
    api: "openai-completions",
    baseUrl: "https://api.xiaomimimo.com/v1",
    apiKey: API_KEY,
    models: MODELS
  });
}
