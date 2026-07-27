import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

/**
 * QuickJS-compatible browser automation via agent-browser CLI.
 * Uses pi.exec() instead of node:child_process — works on both TS Pi and pi_agent_rust.
 */

const TOOL_DESCRIPTION = `Browser automation via agent-browser CLI with persistent session.

Core navigation:
  open <url> [--headed]    Navigate to URL (--headed for visible window)
  back                     Go back in history
  forward                  Go forward in history
  reload                   Reload page
  close                    Close browser

Page interaction:
  snapshot [-i]            Get interactive elements with refs (-i for img alt text)
  click <@ref|sel>         Click element
  fill <@ref|sel> <text>   Clear and type text
  type <@ref|sel> <text>   Type without clearing
  press <key>              Press keyboard key
  select <@ref|sel> <val>  Select dropdown option
  check <@ref|sel>         Check/uncheck checkbox
  hover <@ref|sel>         Hover over element
  scroll <dir> [px]        Scroll up/down/left/right/top/bottom

Semantic find:
  find <type> <target> <action> [value]  By role/text/label/placeholder/alt/testid
  find first <sel> <action> [value]      First matching element
  find last <sel> <action> [value]       Last matching element
  find nth <n> <sel> <action> [value]    Nth matching element

Waiting:
  wait <selector|ms>       Wait for element or time
  wait --text "..."        Wait for text to appear
  wait --url "**/pattern"  Wait for URL
  wait --load networkidle  Wait for load state
  wait --fn "js-expr"      Wait for JS condition

Page info:
  screenshot [path]        Take screenshot (returns file path — vision: check output)
  url                      Get current URL
  title                    Get page title
  text                     Extract visible text

Auth & Storage:
  cookies                  Get cookies
  cookies set <n> <v>      Set cookie
  cookies clear            Clear cookies
  storage local            Get localStorage
  storage local set <k> <v> Set localStorage key

Network:
  network                  List requests
  network block <p>        Block pattern (e.g. *.css)

Diff:
  diff snapshot            Compare snapshots
  diff url <a> <b>         Compare two URLs
`;

async function resolveAgentBrowser(pi: ExtensionAPI): Promise<{ node: string; js: string } | null> {
  try {
    const result = await pi.exec("which", ["agent-browser"], { timeout: 5000 });
    if (result.code !== 0) return null;
    const shim = result.stdout.trim().split(/\r?\n/)[0];
    if (!shim) return null;
    const lastSlash = shim.lastIndexOf("/");
    const d = lastSlash >= 0 ? shim.slice(0, lastSlash) : ".";
    const nativeBin = d + "/agent-browser";
    const jsPath = d + "/node_modules/agent-browser/bin/agent-browser.js";
    try {
      const checkNative = await pi.exec("test", ["-f", nativeBin], { timeout: 2000 });
      if (checkNative.code === 0) return { node: "node", js: nativeBin };
    } catch {}
    try {
      const checkJs = await pi.exec("test", ["-f", jsPath], { timeout: 2000 });
      if (checkJs.code === 0) return { node: "node", js: jsPath };
    } catch {}
    return { node: "node", js: shim };
  } catch {
    return null;
  }
}

async function ensureInstalled(pi: ExtensionAPI, ctx: any): Promise<boolean> {
  const resolved = await resolveAgentBrowser(pi);
  if (resolved) return true;
  if (!ctx.hasUI) return false;
  const ok = await ctx.ui.confirm("agent-browser not found", "Install agent-browser globally?");
  if (!ok) return false;
  ctx.ui.notify("Installing agent-browser...", "info");
  const install = await pi.exec("npm", ["install", "-g", "agent-browser"], { timeout: 120000 });
  if (install.code !== 0) {
    ctx.ui.notify("Failed: " + (install.stderr || "").slice(0, 100), "error");
    return false;
  }
  if (!(await resolveAgentBrowser(pi))) {
    ctx.ui.notify("Binary not found after install", "error");
    return false;
  }
  ctx.ui.notify("Downloading Chromium...", "info");
  await pi.exec("agent-browser", ["install"], { timeout: 120000 }).catch(() => {});
  ctx.ui.notify("Installed!", "info");
  return true;
}

async function execAB(pi: ExtensionAPI, resolved: { node: string; js: string }, args: string[], opts: any = {}) {
  return pi.exec(resolved.node, [resolved.js, ...args], { timeout: 30000, ...opts });
}

export default function agentBrowserExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "browser",
    label: "Browser",
    description: TOOL_DESCRIPTION,
    parameters: Type.Object({
      command: Type.String({ description: "agent-browser command" })
    }),

    async execute(_toolCallId: string, params: any, signal: any, _onUpdate: any, ctx: any) {
      const installed = await ensureInstalled(pi, ctx);
      if (!installed) {
        return { content: [{ type: "text", text: "agent-browser not installed. Run: npm install -g agent-browser && agent-browser install" }], isError: true };
      }
      const resolved = await resolveAgentBrowser(pi);
      if (!resolved) {
        return { content: [{ type: "text", text: "agent-browser binary not found" }], isError: true };
      }

      const cmd = params.command.trim();
      const parts = cmd.split(/\s+/);
      const action = parts[0]?.toLowerCase() || "";
      const rest = cmd.slice(action.length).trim();
      const args = parts.slice(1);

      // Map action → handler
      const handlers: Record<string, () => Promise<any>> = {};

      handlers.close = async () => {
        await pi.exec("pkill", ["-f", "agent-browser"], { timeout: 5000 }).catch(() => {});
        return { content: [{ type: "text", text: "Browser closed." }] };
      };

      handlers.url = async () => {
        const r = await execAB(pi, resolved, ["url"], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no page)" }] };
      };

      handlers.title = async () => {
        const r = await execAB(pi, resolved, ["title"], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no title)" }] };
      };

      handlers.text = async () => {
        const r = await execAB(pi, resolved, ["text"], { signal, timeout: 30000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no text)" }] };
      };

      handlers.wait = async () => {
        const r = await execAB(pi, resolved, args.length ? args : ["500"], { signal, timeout: 60000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "Wait complete." }] };
      };

      handlers.evaluate = async () => {
        const expr = rest;
        if (!expr) return { content: [{ type: "text", text: "Usage: evaluate <js-expression>" }], isError: true };
        const r = await execAB(pi, resolved, ["evaluate", expr], { signal, timeout: 30000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no result)" }] };
      };

      handlers.screenshot = async () => {
        const r = await execAB(pi, resolved, ["screenshot", ...args], { signal, timeout: 30000 });
        const out = r.stdout.trim();
        const pathMatch = out.match(/saved to (.+)$/im);
        if (pathMatch) {
          try {
            // Try to read file content for inline image (Node.js only)
            const read = await pi.exec("cat", [pathMatch[1].trim()], { timeout: 5000 }).catch(() => null);
            if (read && read.code === 0 && read.stdout.length > 0) {
              const b64 = Buffer.from(read.stdout).toString("base64");
              const ext = pathMatch[1].toLowerCase().endsWith(".jpg") || pathMatch[1].toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png";
              return { content: [{ type: "image", data: b64, mimeType: ext }] };
            }
          } catch {}
          return { content: [{ type: "text", text: "Screenshot saved to " + pathMatch[1] }] };
        }
        return { content: [{ type: "text", text: out || "Screenshot taken." }] };
      };

      handlers.cookies = async () => {
        const r = await execAB(pi, resolved, ["cookies", ...args], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no cookies)" }] };
      };

      handlers.storage = async () => {
        const r = await execAB(pi, resolved, ["storage", ...args], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no storage)" }] };
      };

      handlers.network = async () => {
        const r = await execAB(pi, resolved, ["network", ...args], { signal, timeout: 30000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no network data)" }] };
      };

      handlers.diff = async () => {
        const r = await execAB(pi, resolved, ["diff", ...args], { signal, timeout: 60000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "(no diff)" }] };
      };

      handlers.find = async () => {
        const r = await execAB(pi, resolved, ["find", ...args], { signal, timeout: 30000 });
        if (r.code !== 0) {
          return { content: [{ type: "text", text: "Error: " + ((r.stderr || r.stdout).trim()) }], isError: true };
        }
        return { content: [{ type: "text", text: r.stdout.trim() || "(done)" }] };
      };

      // If handler exists, run it
      if (handlers[action]) {
        return handlers[action]();
      }

      // BACK / FORWARD / RELOAD — auto-screenshot
      if (["back", "forward", "reload"].includes(action)) {
        const r = await execAB(pi, resolved, parts, { signal, timeout: 30000 });
        return { content: [{ type: "text", text: r.stdout.trim() || "Done." }] };
      }

      // DEFAULT: forward all commands
      const r = await execAB(pi, resolved, parts, { signal, timeout: 180000 });
      if (r.code !== 0) {
        return { content: [{ type: "text", text: `Error (${r.code}): ${(r.stderr || r.stdout).trim()}` }], isError: true };
      }
      return { content: [{ type: "text", text: r.stdout.trim() || "(no output)" }] };
    },
  });
}
