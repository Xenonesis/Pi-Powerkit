import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.AGENTROUTER_API_KEY || "sk-WiiTVuEHnGUZeKCOPiwB45LrV3udBrtIOvi927k8Gyjz1U6O";

// Verified working models with current API key
const MODELS = [
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 1000000,  // 1M tokens
    maxTokens: 131072,       // 128K output
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 1000000,  // 1M tokens
    maxTokens: 131072,       // 128K output
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    reasoning: true,
    input: ["text", "image"],
    contextWindow: 1048576,  // 1M (922K input + 128K output)
    maxTokens: 131072,
  },
];

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-agentrouter] AGENTROUTER_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("agentrouter", {
    name: "AgentRouter",
    baseUrl: "https://agentrouter.org/v1",
    api: "openai-completions",
    apiKey: API_KEY,
    models: MODELS.map(m => ({
      ...m,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    })),
  });

  console.log(`[pi-agentrouter] Registered ${MODELS.length} models (claude-opus-5, claude-opus-4-8, gpt-5.6-sol)`);
}
