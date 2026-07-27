import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.ROUTER9_API_KEY;

const MODELS = [
    {
      id: "minimax/minimax-m3",
      name: "MiniMax M3",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 1000000,
      maxTokens: 65536
    }
];

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-router9] ROUTER9_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("router9", {
    name: "Router9",
    api: "openai-completions",
    baseUrl: "https://api.router9.com/v1",
    apiKey: API_KEY,
    models: MODELS
  });
}
