import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.OPENGATEWAY_API_KEY;

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-twigpine] OPENGATEWAY_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("twigpine", {
    name: "Twigpine (twigpine.com/opengateway)",
    baseUrl: "https://opengateway.gitlawb.com/v1",
    api: "openai-completions",
    apiKey: API_KEY,
    models: [
      {
        id: "qwen/qwen3.8-max",
        name: "Qwen 3.8 Max (Twigpine Free)",
        reasoning: true,
        input: ["text"],
        contextWindow: 262144,
        maxTokens: 8192,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "qwen/qwen3.8-flash",
        name: "Qwen 3.8 Flash (Twigpine Free)",
        reasoning: true,
        input: ["text"],
        contextWindow: 1048575,
        maxTokens: 8192,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "nvidia/nemotron-3.5-super-vl:free",
        name: "Nemotron 3.5 Super VL (Twigpine Free)",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 1000000,
        maxTokens: 131072,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  console.log("[pi-twigpine] Registered 3 free models");
}
