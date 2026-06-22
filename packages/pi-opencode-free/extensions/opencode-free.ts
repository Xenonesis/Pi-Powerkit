import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const API_KEY = process.env.OPENCODE_API_KEY;
const BASE_URL = "https://opencode.ai/zen/v1";
const CACHE_PATH = join(homedir(), ".pi", "agent", "cache", "opencode-free.json");

// ponytail: hardcoded context windows for known free models (used as fallback + overrides)
const MODEL_CONTEXTS: Record<string, { ctx: number; out: number; reason: boolean; input: string[] }> = {
  "deepseek-v4-flash-free":   { ctx: 1048576, out: 128000, reason: true,  input: ["text"] },
  "mimo-v2.5-free":           { ctx: 1048576, out: 131000, reason: true,  input: ["text", "image"] },
  "nemotron-3-ultra-free":    { ctx: 1000000, out: 16384,  reason: true,  input: ["text"] },
  "north-mini-code-free":     { ctx: 256000,  out: 64000,  reason: true,  input: ["text"] },
  "qwen3.6-plus-free":        { ctx: 1048576, out: 128000, reason: true,  input: ["text"] },
  "minimax-m3-free":          { ctx: 1048576, out: 512000, reason: true,  input: ["text"] },
  "big-pickle":               { ctx: 1048576, out: 128000, reason: true,  input: ["text"] },
};

interface CachedData {
  freeModelIds: string[];
  lastFetch: number;
}

function loadCache(): CachedData | null {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const data = JSON.parse(raw) as CachedData;
    // Cache valid for 1 hour
    if (Date.now() - data.lastFetch < 3600_000) return data;
    return null;
  } catch {
    return null;
  }
}

function saveCache(freeModelIds: string[]): void {
  try {
    const dir = join(homedir(), ".pi", "agent", "cache");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const data: CachedData = { freeModelIds, lastFetch: Date.now() };
    writeFileSync(CACHE_PATH, JSON.stringify(data));
  } catch {
    // ignore
  }
}

async function refreshInBackground(initialIds: string[]): Promise<void> {
  if (!API_KEY) return;
  try {
    const res = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { data: Array<{ id: string }> };
    const freshIds = (json.data ?? []).map((m: any) => m.id).filter((id: string) => id.includes("-free"));
    if (freshIds.length > 0) {
      saveCache(freshIds);
    }
  } catch {
    // ignore
  }
}

export default async function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-opencode-free] OPENCODE_API_KEY not set — `opencode` provider will not be registered");
    return;
  }

  // 1. Load from cache (instant, no network)
  const cache = loadCache();
  const freeModelIds = cache?.freeModelIds ?? Object.keys(MODEL_CONTEXTS);

  // 2. Register provider IMMEDIATELY (no blocking)
  pi.registerProvider("opencode", {
    baseUrl: BASE_URL,
    api: "openai-completions",
    apiKey: API_KEY,
    models: freeModelIds.map((id) => ({
      id,
      name: id
        .replace("-free", " (Free)")
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      reasoning: MODEL_CONTEXTS[id]?.reason ?? true,
      input: MODEL_CONTEXTS[id]?.input ?? ["text"],
      contextWindow: MODEL_CONTEXTS[id]?.ctx ?? 1048576,
      maxTokens: MODEL_CONTEXTS[id]?.out ?? 128000,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    })),
  });

  // 3. Background refresh (non-blocking, ~3s)
  void refreshInBackground(freeModelIds);
}