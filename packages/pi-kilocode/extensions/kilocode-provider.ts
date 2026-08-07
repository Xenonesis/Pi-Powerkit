import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const API_KEY = process.env.KILO_API_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnYiOiJwcm9kdWN0aW9uIiwia2lsb1VzZXJJZCI6IjRkYjY4NDEwLTdiMzYtNGYxNS1hZGUxLWJhNzI2Mzk3YjU5MiIsImFwaVRva2VuUGVwcGVyIjpudWxsLCJ2ZXJzaW9uIjozLCJpYXQiOjE3ODIyMDY1MjIsImV4cCI6MTkzOTg4NjUyMn0.xT6sG1FFL-q2acatKuJOO07jjgN6HGWncl-O6jjXefU";
const BASE_URL = "https://api.kilo.ai/api/gateway/models";
const CACHE_PATH = join(homedir(), ".pi", "agent", "cache", "kilocode-free.json");

// Models to exclude (not useful for coding)
const EXCLUDE_IDS = new Set([
  "google/lyria-3-pro-preview",      // music generation
  "google/lyria-3-clip-preview",     // music generation
  "nvidia/nemotron-3.5-content-safety:free", // content safety moderation
]);

// Fallback static list (used on first run or API failure)
const FALLBACK_MODELS: Record<string, { ctx: number; out: number; reason: boolean; input: string[] }> = {
  "kilo-auto/free":                         { ctx: 256000,  out: 10000,  reason: false, input: ["text"] },
  "stepfun/step-3.7-flash:free":            { ctx: 262144,  out: 262144, reason: false, input: ["text", "image"] },
  "poolside/laguna-s-2.1:free":             { ctx: 262144,  out: 32768,  reason: false, input: ["text"] },
  "tencent/hy3:free":                       { ctx: 262144,  out: 128000, reason: false, input: ["text"] },
  "inclusionai/ling-3.0-tiny:free":         { ctx: 262144,  out: 32768,  reason: false, input: ["text"] },
  "poolside/laguna-xs-2.1:free":            { ctx: 262144,  out: 32768,  reason: false, input: ["text"] },
  "cohere/north-mini-code:free":            { ctx: 256000,  out: 64000,  reason: false, input: ["text"] },
  "nvidia/nemotron-3-ultra-550b-a55b:free": { ctx: 1000000, out: 65536,  reason: false, input: ["text"] },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": { ctx: 256000, out: 65536, reason: false, input: ["text", "image"] },
  "nvidia/nemotron-3-super-120b-a12b:free": { ctx: 262144,  out: 262144, reason: false, input: ["text"] },
  "openrouter/free":                        { ctx: 200000,  out: 8192,   reason: false, input: ["text", "image"] },
};

interface CachedData {
  models: Array<{ id: string; name: string; ctx: number; out: number; input: string[] }>;
  lastFetch: number;
}

function loadCache(): CachedData | null {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const data = JSON.parse(raw) as CachedData;
    if (Date.now() - data.lastFetch < 3600_000) return data; // 1 hour cache
    return null;
  } catch {
    return null;
  }
}

function saveCache(models: Array<{ id: string; name: string; ctx: number; out: number; input: string[] }>): void {
  try {
    const dir = join(homedir(), ".pi", "agent", "cache");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const data: CachedData = { models, lastFetch: Date.now() };
    writeFileSync(CACHE_PATH, JSON.stringify(data));
  } catch {
    // ignore
  }
}

async function fetchFreeModels(): Promise<Array<{ id: string; name: string; ctx: number; out: number; input: string[] }>> {
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json() as { data: any[] };
  const all = json.data || [];

  const free = all.filter(m => {
    const p = m.pricing || {};
    const prompt = parseFloat(p.prompt || "1");
    const completion = parseFloat(p.completion || "1");
    if (prompt !== 0 || completion !== 0) return false;
    if (EXCLUDE_IDS.has(m.id)) return false;
    return true;
  });

  return free.map(m => ({
    id: m.id,
    name: m.name || m.id,
    ctx: m.context_length || m.top_provider?.context_length || 128000,
    out: m.max_tokens || m.top_provider?.max_completion_tokens || 32768,
    input: m.architecture?.input_modalities || ["text"],
  }));
}

export default async function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-kilocode] KILO_API_KEY not set — provider not registered");
    return;
  }

  // 1. Try cache first (instant)
  let cached = loadCache();
  let models: Array<{ id: string; name: string; ctx: number; out: number; input: string[] }>;

  if (cached) {
    models = cached.models;
  } else {
    // 2. Try API fetch
    try {
      models = await fetchFreeModels();
      saveCache(models);
    } catch {
      // 3. Fallback to static list
      models = Object.entries(FALLBACK_MODELS).map(([id, p]) => ({
        id, name: id, ctx: p.ctx, out: p.out, input: p.input,
      }));
    }
  }

  // 4. Background refresh (non-blocking)
  if (!cached || (Date.now() - (cached as CachedData).lastFetch > 3600_000)) {
    void fetchFreeModels().then(fresh => {
      if (fresh.length > 0) saveCache(fresh);
    }).catch(() => {});
  }

  const registered = models.map(m => ({
    id: m.id,
    name: m.name,
    reasoning: false,
    input: m.input,
    contextWindow: m.ctx,
    maxTokens: m.out,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  }));

  pi.registerProvider("kilocode", {
    name: "KiloCode (Free Models)",
    baseUrl: "https://api.kilo.ai/api/openrouter/v1",
    apiKey: API_KEY,
    api: "openai-completions",
    models: registered,
  });

  console.log(`[pi-kilocode] Registered ${registered.length} free models`);
}
