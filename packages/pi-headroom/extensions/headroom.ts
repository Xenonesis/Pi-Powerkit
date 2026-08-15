import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function registerHeadroomExtension(pi: ExtensionAPI) {
  const API_URL = process.env.HEADROOM_API_URL || "http://127.0.0.1:8787";
  const API_KEY = process.env.HEADROOM_API_KEY || "";

  pi.registerTool(
    defineTool({
      name: "headroom_compress",
      description:
        "Compress text or messages using Headroom to reduce token usage (60-95% savings). Use this when context is getting large.",
      parameters: Type.Object({
        text: Type.String({ description: "The text/messages to compress" }),
        model: Type.Optional(
          Type.String({ description: "Model to use for compression (default: gpt-4o-mini)" })
        ),
      }),
      async execute({ text, model = "gpt-4o-mini" }) {
        try {
          const res = await fetch(`${API_URL}/compress`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
            },
            body: JSON.stringify({ text, model }),
            signal: AbortSignal.timeout(60_000),
          });

          if (!res.ok) {
            const errText = await res.text();
            return {
              compressed: text,
              originalTokens: 0,
              compressedTokens: 0,
              savedPercent: 0,
              error: `HTTP ${res.status}: ${errText}`,
            };
          }

          const data = await res.json();
          return {
            compressed: data.compressed || text,
            originalTokens: data.originalTokens ?? 0,
            compressedTokens: data.compressedTokens ?? 0,
            savedPercent: data.savedPercent ?? 0,
            error: "",
          };
        } catch (e: any) {
          return {
            compressed: text,
            originalTokens: 0,
            compressedTokens: 0,
            savedPercent: 0,
            error: e.message || "Connection failed",
          };
        }
      },
    })
  );

  pi.registerTool(
    defineTool({
      name: "headroom_status",
      description: "Check if Headroom proxy/cloud is reachable.",
      parameters: Type.Object({}),
      async execute() {
        try {
          const res = await fetch(`${API_URL}/health`, {
            headers: {
              ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
            },
            signal: AbortSignal.timeout(5_000),
          });
          return {
            reachable: res.ok,
            url: API_URL,
            error: res.ok ? "" : `HTTP ${res.status}`,
          };
        } catch (e: any) {
          return { reachable: false, url: API_URL, error: e.message || "Unreachable" };
        }
      },
    })
  );
}