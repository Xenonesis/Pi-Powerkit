import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, extname, dirname } from "node:path";
import { execSync, spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const TOOL_DESCRIPTION = `Browser automation via agent-browser CLI with persistent session.

Core navigation:
  open <url> [--headed]    Navigate to URL (--headed for visible window)
  back                     Go back in history
  forward                  Go forward in history
  reload                   Reload page
  close                    Close browser

Page interaction:
  snapshot [-i]            Get interactive elements with refs (use -i for img alt text)
  click <@ref|sel>         Click element
  fill <@ref|sel> <text>   Clear and type text
  type <@ref|sel> <text>   Type without clearing
  press <key>              Press keyboard key
  select <@ref|sel> <val>  Select dropdown option by value/label
  check <@ref|sel>         Check/uncheck a checkbox
  hover <@ref|sel>         Hover over element
  scroll <dir> [px]        Scroll (up/down/left/right/top/bottom)

Semantic find (use instead of @ref):
  find role <role> <action> [value]        By ARIA role (button, link, heading, etc)
  find text <text> <action> [value]        By visible text content
  find label <label> <action> [value]      By label element text
  find placeholder <text> <action> [value] By placeholder attribute
  find alt <text> <action> [value]         By image alt text
  find testid <id> <action> [value]        By data-testid
  find first <sel> <action> [value]        First matching element
  find last <sel> <action> [value]         Last matching element
  find nth <n> <sel> <action> [value]      Nth matching element
  Actions: click, fill, check, hover, text

Waiting:
  wait <selector>          Wait for element to be visible
  wait <ms>                Wait milliseconds
  wait --text "..."        Wait for text to appear
  wait --url "**/pattern"  Wait for URL pattern
  wait --load networkidle  Wait for page load state
  wait --fn "js-expr"      Wait for JS condition to be true

Page info:
  screenshot [path]        Take screenshot (returns image for vision models)
  url                      Get current page URL
  title                    Get page title
  text                     Extract all visible text

Auth & Storage:
  cookies                  Get all cookies (JSON)
  cookies set <name> <val> Set a cookie
  cookies clear            Clear all cookies
  cookies import <file>    Import cookies from file (curl/JSON/Cookie header)
  storage local            Get all localStorage
  storage local set <k> <v> Set localStorage key
  storage local clear      Clear localStorage

Network:
  network                  List network requests
  network block <pattern>  Block requests matching pattern (e.g. *.css, *.jpg)

Diff/Compare:
  diff snapshot            Compare current vs last snapshot
  diff url <url1> <url2>   Compare two URLs

Note: Browser stays open between commands. Auto-screenshot after navigation.
`;

let agentBrowserJs: string | null = null;
let nodePath: string | null = null;

function resolveAgentBrowser(): { node: string; js: string } | null {
  if (agentBrowserJs && nodePath) return { node: nodePath, js: agentBrowserJs };
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const out = execSync(`${cmd} agent-browser`, { encoding: "utf-8", shell: true }).trim();
    const shim = out.split(/\r?\n/)[0];
    if (!shim) return null;
    const d = dirname(shim);
    const jsPath = join(d, "node_modules", "agent-browser", "bin", "agent-browser.js");
    const nativeBin = join(d, "agent-browser");
    if (existsSync(nativeBin)) {
      nodePath = "node";
      agentBrowserJs = nativeBin;
      return { node: "node", js: nativeBin };
    }
    if (existsSync(jsPath)) {
      const nodeExe = join(d, "node.exe");
      nodePath = existsSync(nodeExe) ? nodeExe : "node";
      agentBrowserJs = jsPath;
      return { node: nodePath, js: jsPath };
    }
  } catch {}
  return null;
}

async function ensureInstalled(pi: ExtensionAPI, ctx: any): Promise<boolean> {
  if (resolveAgentBrowser()) return true;
  if (!ctx.hasUI) return false;
  const ok = await ctx.ui.confirm("agent-browser not found", "Install agent-browser globally?");
  if (!ok) return false;
  ctx.ui.notify("Installing agent-browser...", "info");
  const install = await pi.exec("npm", ["install", "-g", "agent-browser"], { timeout: 120000 });
  if (install.code !== 0) {
    ctx.ui.notify(`Failed: ${install.stderr}`, "error");
    return false;
  }
  if (!resolveAgentBrowser()) {
    ctx.ui.notify("Binary not found after install", "error");
    return false;
  }
  ctx.ui.notify("Downloading Chromium...", "info");
  await pi.exec("agent-browser", ["install"], { timeout: 120000 }).catch(() => ({}));
  ctx.ui.notify("Installed!", "info");
  return true;
}

async function takeScreenshot(pi: ExtensionAPI, resolved: any): Promise<string | null> {
  try {
    const result = await pi.exec(resolved.node, [resolved.js, "screenshot"], { timeout: 30000 });
    if (result.code === 0 && result.stdout.trim()) {
      const pathMatch = result.stdout.match(/saved to (.+)$/im);
      if (pathMatch && existsSync(pathMatch[1].trim())) {
        return pathMatch[1].trim();
      }
    }
  } catch { /* ignore */ }
  return null;
}

function parseCommand(cmd: string): { action: string; args: string[]; rest: string } {
  const parts = cmd.trim().split(/\s+/);
  return { action: parts[0]?.toLowerCase() || "", args: parts.slice(1), rest: cmd.trim() };
}

export default function agentBrowserExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "browser",
    label: "Browser",
    description: TOOL_DESCRIPTION,
    parameters: Type.Object({
      command: Type.String({ description: "agent-browser command. See description for full command list." })
    }),

    async execute(_toolCallId: string, params: any, signal: any, _onUpdate: any, ctx: any) {
      const installed = await ensureInstalled(pi, ctx);
      if (!installed) {
        return { content: [{ type: "text", text: "agent-browser not installed. Run: npm install -g agent-browser && agent-browser install" }], isError: true };
      }
      const resolved = resolveAgentBrowser();
      if (!resolved) {
        return { content: [{ type: "text", text: "agent-browser binary not found on PATH" }], isError: true };
      }

      const { action, args, rest } = parseCommand(params.command);

      // --- CLOSE ---
      if (action === "close") {
        try { await pi.exec("killall", ["agent-browser"], { timeout: 5000 }).catch(() => ({})); } catch {}
        try { await pi.exec("pkill", ["-f", "agent-browser"], { timeout: 5000 }).catch(() => ({})); } catch {}
        return { content: [{ type: "text", text: "Browser closed." }] };
      }

      // --- URL ---
      if (action === "url") {
        const result = await pi.exec(resolved.node, [resolved.js, "url"], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no page)" }] };
      }

      // --- TITLE ---
      if (action === "title") {
        const result = await pi.exec(resolved.node, [resolved.js, "title"], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no title)" }] };
      }

      // --- TEXT ---
      if (action === "text") {
        const result = await pi.exec(resolved.node, [resolved.js, "text"], { signal, timeout: 30000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no text)" }] };
      }

      // --- WAIT ---
      if (action === "wait") {
        const result = await pi.exec(resolved.node, [resolved.js, ...args.length ? args : ["500"]], { signal, timeout: 60000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "Wait complete." }] };
      }

      // --- EVALUATE ---
      if (action === "evaluate") {
        const expr = rest.slice("evaluate".length).trim();
        if (!expr) return { content: [{ type: "text", text: "Usage: evaluate <js-expression>" }], isError: true };
        const result = await pi.exec(resolved.node, [resolved.js, "evaluate", expr], { signal, timeout: 30000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no result)" }] };
      }

      // --- SCREENSHOT ---
      if (action === "screenshot") {
        const result = await pi.exec(resolved.node, [resolved.js, "screenshot", ...args], { signal, timeout: 30000 });
        const out = result.stdout.trim();
        const pathMatch = out.match(/saved to (.+)$/im);
        if (pathMatch && existsSync(pathMatch[1].trim())) {
          const img = readFileSync(pathMatch[1].trim());
          const ext = extname(pathMatch[1].toLowerCase());
          const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
          return { content: [{ type: "image", data: img.toString("base64"), mimeType: mime }] };
        }
        return { content: [{ type: "text", text: out || "Screenshot taken." }] };
      }

      // --- COOKIES ---
      if (action === "cookies") {
        if (args[0] === "import") {
          const cookieFile = args[1];
          if (!cookieFile) return { content: [{ type: "text", text: "Usage: cookies import <file>" }], isError: true };
          const result = await pi.exec(resolved.node, [resolved.js, "cookies", "set", "--curl", cookieFile], { signal, timeout: 15000 });
          return { content: [{ type: "text", text: result.stdout.trim() || "Cookies imported." }] };
        }
        const result = await pi.exec(resolved.node, [resolved.js, "cookies", ...args], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no cookies)" }] };
      }

      // --- STORAGE ---
      if (action === "storage") {
        const result = await pi.exec(resolved.node, [resolved.js, "storage", ...args], { signal, timeout: 15000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no storage)" }] };
      }

      // --- NETWORK ---
      if (action === "network") {
        const result = await pi.exec(resolved.node, [resolved.js, "network", ...args], { signal, timeout: 30000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no network data)" }] };
      }

      // --- DIFF ---
      if (action === "diff") {
        const result = await pi.exec(resolved.node, [resolved.js, "diff", ...args], { signal, timeout: 60000 });
        return { content: [{ type: "text", text: result.stdout.trim() || "(no diff)" }] };
      }

      // --- FIND (semantic locators) ---
      if (action === "find") {
        const result = await pi.exec(resolved.node, [resolved.js, "find", ...args], { signal, timeout: 30000 });
        if (result.code !== 0) {
          return { content: [{ type: "text", text: `Error: ${(result.stderr || result.stdout).trim()}` }], isError: true };
        }
        // Auto-screenshot after find actions that modify page
        const findAction = args[1] || "";
        if (["click", "fill", "check", "hover"].includes(findAction)) {
          const shot = await takeScreenshot(pi, resolved);
          if (shot) {
            const img = readFileSync(shot);
            return { content: [{ type: "image", data: img.toString("base64"), mimeType: "image/png" }] };
          }
        }
        return { content: [{ type: "text", text: result.stdout.trim() || "(done)" }] };
      }

      // --- OPEN with --headed (persistent browser) ---
      if (action === "open" && rest.includes("--headed")) {
        try {
          const portResult = await pi.exec(resolved.node, [resolved.js, "open", "--headed", "--auto-connect"], { signal, timeout: 10000 });
          const url = args.find((a: string) => a.startsWith("http") || a.startsWith("file://"));
          if (url) {
            await pi.exec(resolved.node, [resolved.js, "open", url], { signal, timeout: 30000 });
          }
          await takeScreenshot(pi, resolved);
          return { content: [{ type: "text", text: `🔴 Browser opened${url ? ` at ${url}` : ""}\nPersistent session. Use 'close' to kill.` }] };
        } catch {
          return { content: [{ type: "text", text: "Failed to start headed browser" }], isError: true };
        }
      }

      // --- BACK / FORWARD / RELOAD ---
      if (["back", "forward", "reload"].includes(action)) {
        const result = await pi.exec(resolved.node, [resolved.js, ...parts], { signal, timeout: 30000 });
        const shot = await takeScreenshot(pi, resolved);
        if (shot) {
          try {
            const img = readFileSync(shot);
            return { content: [{ type: "image", data: img.toString("base64"), mimeType: "image/png" }, { type: "text", text: result.stdout.trim() || "Done." }] };
          } catch {}
        }
        return { content: [{ type: "text", text: result.stdout.trim() || "Done." }] };
      }

      // --- DEFAULT: forward all other commands to agent-browser CLI ---
      const parts = rest.split(/\s+/);
      const result = await pi.exec(resolved.node, [resolved.js, ...parts], { signal, timeout: 180000 });

      if (result.code !== 0) {
        return { content: [{ type: "text", text: `Error (${result.code}): ${(result.stderr || result.stdout).trim()}` }], isError: true };
      }

      const output = result.stdout.trim();

      // Auto-screenshot after navigation/mutation actions
      if (["open", "click", "fill", "type", "press", "scroll", "select", "check", "hover"].includes(action)) {
        const shot = await takeScreenshot(pi, resolved);
        if (shot) {
          try {
            const img = readFileSync(shot);
            return { content: [{ type: "image", data: img.toString("base64"), mimeType: "image/png" }, { type: "text", text: output || "(done)" }] };
          } catch {}
        }
      }

      return { content: [{ type: "text", text: output || "(no output)" }] };
    },
  });
}
