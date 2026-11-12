import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const API_KEY = process.env.KILO_API_KEY ?? "";
const BASE_URL = "https://api.kilo.ai/api/gateway/models";
const CACHE_PATH = join(homedir(), ".pi", "agent", "cache", "kilocode-free.json");

// Safety classifier + deprecated/rotated models are not useful as chat models
const EXCLUDE_IDS: Record<string, true> = {
  "nvidia/nemotron-3.5-content-safety:free": true,
  "google/lyria-3-pro-preview": true,
  "google/lyria-3-clip-preview": true,
  "stepfun/step-5-preview-free": true,
  "inclusionai/ling-3.1-flash": true,
  // Listed by gateway but 403 "not available in your region" for this key
  "thinkingmachines/inkling-2-small:free": true,
};

// pi's ModelsConfigSchema allows input ("text" | "image")[] only
const KNOWN_INPUT: Record<string, true> = {
  text: true,
  image: true,
};

// Static fallback when the gateway is unreachable — refreshed 2026-11-12 (live-verified)
const FALLBACK_MODELS: Record<string, { ctx: number; out: number; reason: boolean; input: string[] }> = {
  "kilo-auto/free": { ctx: 256000, out: 32768, reason: false, input: ["text"] },
  "nvidia/nemotron-3.5-super-vl:free": { ctx: 1000000, out: 131072, reason: true, input: ["text","image"] },
  "stealth/glyph-cluster": { ctx: 256000, out: 256000, reason: true, input: ["text"] },
  "baidu/ernie-5.5-flash-preview:free": { ctx: 1024000, out: 921600, reason: true, input: ["text"] },
  "liquid/lfm-3-1.7b:free": { ctx: 262144, out: 8192, reason: true, input: ["text"] },
  "dots-studio/dots-3-note-preview:free": { ctx: 512000, out: 460800, reason: true, input: ["text","image"] },
  "nvidia/nemotron-3.5-lightning:free": { ctx: 1000000, out: 65536, reason: true, input: ["text"] },
  "cohere/north-mini-code:free": { ctx: 256000, out: 64000, reason: true, input: ["text"] },
  "nvidia/nemotron-3-ultra-550b-a55b:free": { ctx: 1000000, out: 65536, reason: true, input: ["text"] },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": { ctx: 256000, out: 65536, reason: true, input: ["text","image"] },
  "openrouter/free": { ctx: 200000, out: 32768, reason: false, input: ["text","image"] },
};

interface KiloModel {
  id: string;
  name: string;
  ctx: number;
  out: number;
  input: string[];
  reasoning: boolean;
}

interface CachedData {
  models: KiloModel[];
  timestamp: number;
}

function loadCache(): CachedData | null {
  try {
    if (existsSync(CACHE_PATH)) {
      const data = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
      if (Date.now() - data.timestamp < 3600000) {
        return data;
      }
    }
  } catch {}
  return null;
}

function saveCache(models: KiloModel[]): void {
  try {
    const dir = join(homedir(), ".pi", "agent", "cache");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(CACHE_PATH, JSON.stringify({ models, timestamp: Date.now() }, null, 2));
  } catch {}
}

async function fetchFreeModels(): Promise<KiloModel[]> {
  try {
    const response = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      data?: Array<{
        id: string;
        name: string;
        context_length?: number;
        top_provider?: { context_length?: number; max_completion_tokens?: number };
        architecture?: { input_modalities?: string[]; output_modalities?: string[] };
        opencode?: { variants?: Record<string, { reasoning?: { enabled?: boolean } }> };
      }>;
    };

    const models = data.data || [];
    return models
      .filter((m) => m.id.endsWith(":free") || m.id.endsWith("-free") || m.id === "kilo-auto/free" || m.id === "stealth/glyph-cluster" || m.id === "openrouter/free")
      .filter((m) => !EXCLUDE_IDS[m.id])
      .filter((m) => (m.architecture?.output_modalities || ["text"]).includes("text"))
      .map((m) => {
        const fallback = FALLBACK_MODELS[m.id];
        // Thinking-variant detection: kilo exposes per-model reasoning variants
        // (e.g. { instant, thinking } or { none, medium, high }) via opencode.variants
        const variants = m.opencode?.variants;
        const hasThinkingVariant =
          variants !== undefined &&
          Object.values(variants).some((v) => v?.reasoning?.enabled === true);
        return {
          id: m.id,
          name: m.name,
          ctx: m.context_length || m.top_provider?.context_length || fallback?.ctx || 262144,
          out: m.top_provider?.max_completion_tokens || fallback?.out || 65536,
          input: (m.architecture?.input_modalities || fallback?.input || ["text"]).filter((x) => KNOWN_INPUT[x]),
          reasoning: hasThinkingVariant || fallback?.reason || false,
        };
      });
  } catch {
    return [];
  }
}

export default async function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-kilocode] KILO_API_KEY not set — provider not registered");
    return;
  }
  let modelList: KiloModel[] = [];

  const cached = loadCache();
  if (cached && cached.models.length > 0) {
    modelList = cached.models;
  } else {
    modelList = await fetchFreeModels();
    if (modelList.length > 0) {
      saveCache(modelList);
    } else {
      modelList = Object.entries(FALLBACK_MODELS).map(([id, m]) => ({
        id,
        name: id,
        ctx: m.ctx,
        out: m.out,
        input: m.input,
        reasoning: m.reason,
      }));
    }
  }

  pi.registerProvider("kilocode", {
    name: "KiloCode (Free Models)",
    baseUrl: "https://api.kilo.ai/api/openrouter/v1",
    apiKey: API_KEY,
    api: "openai-completions",
    models: modelList.map((m) => ({
      id: m.id,
      name: m.name,
      reasoning: m.reasoning,
      input: (m.input || ["text"]).filter((x) => x === "text" || x === "image") as ("text" | "image")[],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: m.ctx,
      maxTokens: m.out,
    })),
  });

  console.log(`[pi-kilocode] Registered ${modelList.length} free models`);
}
