import { readFileSync, mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, extname, dirname } from "node:path";
import { execSync, spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const TOOL_DESCRIPTION = `Browser automation via agent-browser CLI with persistent session.

Commands:
  open <url> [--headed] - Navigate to URL (--headed for visible window)
  snapshot [-i] - Get interactive elements with refs
  click <@ref|sel> - Click element
  fill <@ref|sel> <text> - Clear and type
  type <@ref|sel> <text> - Type without clearing
  press <key> - Press key
  scroll <dir> [px] - Scroll
  screenshot [path] - Take screenshot (returns image)
  back - Go back in history
  forward - Go forward in history
  reload - Reload page
  close - Close browser

Note: Browser stays open between commands. After open/click, auto-screenshot taken.`;

// Resolve agent-browser binary path
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
    const nodeExe = join(d, "node.exe");
    const nodeFinal = existsSync(nodeExe) ? nodeExe : "node";
    if (existsSync(jsPath)) {
      agentBrowserJs = jsPath;
      nodePath = nodeFinal;
      return { node: nodeFinal, js: jsPath };
    }
  } catch {}
  return null;
}

// Persistent browser process
let browserProcess: any = null;
let browserPort: number | null = null;

async function startPersistentBrowser(pi: ExtensionAPI): Promise<number | null> {
  if (browserProcess) return browserPort;
  const resolved = resolveAgentBrowser();
  if (!resolved) return null;

  return new Promise((resolve) => {
    try {
      const proc = spawn(resolved.node, [resolved.js, "open", "--headed", "--auto-connect"], {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        detached: false,
      });

      let portMatch: number | null = null;
      proc.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        const match = text.match(/port[:\s]*(\d+)/i) || text.match(/:(\d{4,5})/);
        if (match) portMatch = parseInt(match[1]);
      });
      proc.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        const match = text.match(/port[:\s]*(\d+)/i) || text.match(/:(\d{4,5})/);
        if (match) portMatch = parseInt(match[1]);
      });
      proc.on("error", () => { browserProcess = null; browserPort = null; resolve(null); });
      proc.on("exit", () => { browserProcess = null; browserPort = null; });

      setTimeout(() => {
        if (proc.exitCode === null) {
          browserProcess = proc;
          browserPort = portMatch || 9222;
          resolve(browserPort);
        } else {
          resolve(null);
        }
      }, 5000);
    } catch { resolve(null); }
  });
}

async function killPersistentBrowser(): Promise<void> {
  if (browserProcess) {
    try { browserProcess.kill("SIGTERM"); } catch {}
    browserProcess = null;
    browserPort = null;
  }
  try { execSync("taskkill /F /IM chrome.exe 2>nul", { shell: true, timeout: 3000 }); } catch {}
}

async function ensureInstalled(pi: ExtensionAPI, ctx: any): Promise<boolean> {
  const resolved = resolveAgentBrowser();
  if (resolved) return true;
  if (!ctx.hasUI) return false;
  const ok = await ctx.ui.confirm("agent-browser not found", "Install agent-browser globally?");
  if (!ok) return false;
  ctx.ui.notify("Installing...", "info");
  const install = await pi.exec("npm", ["install", "-g", "agent-browser"], { timeout: 120000 });
  if (install.code !== 0) { ctx.ui.notify(`Failed: ${install.stderr}`, "error"); return false; }
  const after = resolveAgentBrowser();
  if (!after) { ctx.ui.notify("Path not found", "error"); return false; }
  ctx.ui.notify("Downloading Chromium...", "info");
  await pi.exec("cmd.exe", ["/c", "agent-browser", "install"], { timeout: 120000 }).catch(() => ({}));
  ctx.ui.notify("Installed!", "info");
  return true;
}

async function takeScreenshot(pi: ExtensionAPI, resolved: any): Promise<void> {
  try {
    const result = await pi.exec(resolved.node, [resolved.js, "screenshot"], { timeout: 30000 });
    if (result.code === 0 && result.stdout.includes("saved to")) {
      const pathMatch = result.stdout.match(/saved to (.+)$/i);
      if (pathMatch) {
        const img = readFileSync(pathMatch[1].trim());
        const base64 = img.toString("base64");
        const ext = extname(pathMatch[1].toLowerCase());
        const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
        // Emit for vision model
        pi.emit?.("screenshot", { data: base64, mimeType: mime });
      }
    }
  } catch { /* ignore */ }
}

export default function agentBrowserExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "browser",
    label: "Browser",
    description: TOOL_DESCRIPTION,
    parameters: Type.Object({ command: Type.String({ description: "agent-browser command" }) }),

    async execute(_toolCallId: string, params: any, signal: any, _onUpdate: any, ctx: any) {
      const installed = await ensureInstalled(pi, ctx);
      if (!installed) return { content: [{ type: "text", text: "agent-browser not installed" }], isError: true };

      const resolved = resolveAgentBrowser();
      if (!resolved) return { content: [{ type: "text", text: "agent-browser binary not found" }], isError: true };

      const commandStr = params.command.trim();
      const parts = commandStr.split(/\s+/);
      const action = parts[0].toLowerCase();

      // CLOSE
      if (action === "close") {
        await killPersistentBrowser();
        return { content: [{ type: "text", text: "Browser closed." }] };
      }

      // BACK
      if (action === "back") {
        const result = await pi.exec(resolved.node, [resolved.js, "back"], { signal, timeout: 30000 });
        await takeScreenshot(pi, resolved);
        return { content: [{ type: "text", text: result.stdout || "Back" }] };
      }

      // FORWARD
      if (action === "forward") {
        const result = await pi.exec(resolved.node, [resolved.js, "forward"], { signal, timeout: 30000 });
        await takeScreenshot(pi, resolved);
        return { content: [{ type: "text", text: result.stdout || "Forward" }] };
      }

      // RELOAD
      if (action === "reload") {
        const result = await pi.exec(resolved.node, [resolved.js, "reload"], { signal, timeout: 30000 });
        await takeScreenshot(pi, resolved);
        return { content: [{ type: "text", text: result.stdout || "Reloaded" }] };
      }

      // TABS - not available in this version, skip

      // OPEN with --headed
      if (action === "open" && commandStr.includes("--headed")) {
        const port = await startPersistentBrowser(pi);
        if (!port) return { content: [{ type: "text", text: "Failed to start browser" }], isError: true };
        const url = parts.find((p: string) => p.startsWith("http"));
        const result = await pi.exec(resolved.node, [resolved.js, "open", url || ""], { signal, timeout: 30000 });
        await takeScreenshot(pi, resolved);
        return { content: [{ type: "text", text: `🔴 Browser OPENED\n${url ? `URL: ${url}\n` : ""}\n💡 Persistent session. Use 'close' to kill.` }] };
      }

      // All other commands
      const args = [resolved.js, ...parts];
      const result = await pi.exec(resolved.node, args, { signal, timeout: 180000 });

      if (result.code !== 0) {
        return { content: [{ type: "text", text: `Error ${result.code}: ${(result.stderr || result.stdout).trim()}` }], isError: true };
      }

      const output = result.stdout.trim();

      // Auto-screenshot after navigation actions
      if (["open", "click", "fill", "type", "press", "scroll"].includes(action)) {
        await takeScreenshot(pi, resolved);
      }

      // Screenshot handling
      if (action === "screenshot") {
        const pathMatch = output.match(/saved to (.+)$/i);
        if (pathMatch) {
          const img = readFileSync(pathMatch[1].trim());
          const base64 = img.toString("base64");
          const mime = extname(pathMatch[1].toLowerCase()) === ".jpg" ? "image/jpeg" : "image/png";
          return { content: [{ type: "image", data: base64, mimeType: mime }] };
        }
      }

      return { content: [{ type: "text", text: output || "(no output)" }] };
    },
  });

  pi.on("session_shutdown", killPersistentBrowser);
}