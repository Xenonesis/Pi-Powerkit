import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.KILO_API_KEY;

interface KiloModel {
  id: string;
  name: string;
  reasoning: boolean;
  input: string[];
  contextWindow: number;
  maxTokens: number;
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

// Free model IDs with known context windows
const FREE_MODELS: Record<string, { ctx: number; out: number; reason: boolean; input: string[] }> = {
  "kilo-auto/free":                         { ctx: 128000,  out: 65536,  reason: true,  input: ["text"] },
  "poolside/laguna-m.1:free":               { ctx: 131072,  out: 16384,  reason: true,  input: ["text"] },
  "stepfun/step-3.7-flash:free":            { ctx: 262144,  out: 65536,  reason: true,  input: ["text"] },
  "cohere/north-mini-code:free":            { ctx: 256000,  out: 64000,  reason: true,  input: ["text"] },
  "nvidia/nemotron-3.5-content-safety:free": { ctx: 128000,  out: 16384,  reason: true,  input: ["text"] },
  "nvidia/nemotron-3-ultra-550b-a55b:free":  { ctx: 1000000, out: 65536,  reason: true,  input: ["text"] },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": { ctx: 128000, out: 16384, reason: true, input: ["text"] },
  "poolside/laguna-xs.2:free":              { ctx: 131072,  out: 16384,  reason: true,  input: ["text"] },
  "nvidia/nemotron-3-super-120b-a12b:free":  { ctx: 1000000, out: 262144, reason: true, input: ["text"] },
  "openrouter/free":                        { ctx: 200000,  out: 8192,   reason: true,  input: ["text"] },
};

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-kilocode] KILO_API_KEY not set — provider not registered");
    return;
  }

  const models: KiloModel[] = Object.entries(FREE_MODELS).map(([id, props]) => ({
    id,
    name: id,
    reasoning: props.reason,
    input: props.input,
    contextWindow: props.ctx,
    maxTokens: props.out,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  }));

  pi.registerProvider("kilocode", {
    name: "KiloCode (Free Models)",
    baseUrl: "https://api.kilo.ai/api/openrouter/v1",
    apiKey: API_KEY,
    api: "openai-completions",
    models,
  });

  console.log(`[pi-kilocode] Registered ${models.length} free models`);
}
