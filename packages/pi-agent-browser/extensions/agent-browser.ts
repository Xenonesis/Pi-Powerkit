import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname, dirname } from "node:path";
import { execSync } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const TOOL_DESCRIPTION = `Browser automation via agent-browser CLI.
Workflow: open URL → snapshot -i (get @refs like @e1) → interact → re-snapshot after page changes.
Commands:
  open <url> - Navigate to URL
  open <url> --headed - Open with visible browser window (Playwright-style)
  snapshot -i - Interactive elements with @refs (re-snapshot after navigation)
  click <@ref> - Click element
  fill <@ref> <text> - Clear and type
  type <@ref> <text> - Type without clearing
  select <@ref> <value> - Select dropdown
  press <key> - Press key (Enter, Tab, etc.)
  scroll <dir> [px] - Scroll (up/down/left/right)
  get text|url|title [@ref] - Get information
  wait <@ref|ms> - Wait for element or time
  screenshot [--full] - Take screenshot (image returned inline)
  close - Close browser
Any valid agent-browser command works.`;

// ponytail: agent-browser is a POSIX shell wrapper, can't be spawned directly on Windows
// Resolve to the actual JS file path
let agentBrowserJs: string | null = null;
let nodePath: string | null = null;

function resolveAgentBrowser(): { node: string; js: string } | null {
  if (agentBrowserJs && nodePath) return { node: nodePath, js: agentBrowserJs };
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    const out = execSync(`${cmd} agent-browser`, { encoding: "utf-8", shell: true }).trim();
    const shim = out.split(/\r?\n/)[0];
    if (!shim) return null;
    // The shim is a shell script: exec node "$basedir/node_modules/agent-browser/bin/agent-browser.js" "$@"
    // Find node and the JS file
    const dir = dirname(shim);
    const jsPath = join(dir, "node_modules", "agent-browser", "bin", "agent-browser.js");
    const nodeExe = join(dir, "node.exe");
    const nodeFinal = existsSync(nodeExe) ? nodeExe : "node";
    if (existsSync(jsPath)) {
      agentBrowserJs = jsPath;
      nodePath = nodeFinal;
      return { node: nodeFinal, js: jsPath };
    }
  } catch {}
  return null;
}

import { existsSync } from "node:fs";

function writeTempFile(content: string, prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `pi-browser-${prefix}-`));
  const file = join(dir, "output.txt");
  writeFileSync(file, content);
  return file;
}

async function ensureInstalled(pi: ExtensionAPI, ctx: any): Promise<boolean> {
  const resolved = resolveAgentBrowser();
  if (resolved) return true;
  if (!ctx.hasUI) return false;
  const ok = await ctx.ui.confirm(
    "agent-browser not found",
    "Install agent-browser globally with npm? (npm install -g agent-browser)",
  );
  if (!ok) return false;
  ctx.ui.notify("Installing agent-browser...", "info");
  const install = await pi.exec("npm", ["install", "-g", "agent-browser"], { timeout: 120000 });
  if (install.code !== 0) {
    ctx.ui.notify(`Installation failed: ${install.stderr}`, "error");
    return false;
  }
  agentBrowserJs = null;
  nodePath = null;
  const after = resolveAgentBrowser();
  if (!after) {
    ctx.ui.notify("agent-browser installed but path not found", "error");
    return false;
  }
  ctx.ui.notify("Downloading Chromium...", "info");
  // Use shell for install since it may need npm-style scripts
  const chromium = await pi.exec("cmd.exe", ["/c", "agent-browser", "install"], { timeout: 120000 }).catch(() => ({ code: 1, stderr: "install failed" }));
  if (chromium.code !== 0) {
    ctx.ui.notify(`Chromium install failed: ${chromium.stderr}`, "error");
    return false;
  }
  ctx.ui.notify("agent-browser installed successfully!", "info");
  return true;
}

export default function agentBrowserExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "browser",
    label: "Browser",
    description: TOOL_DESCRIPTION,
    parameters: Type.Object({
      command: Type.String({ description: "agent-browser command (without 'agent-browser' prefix)" }),
    }),

    async execute(_toolCallId: string, params: any, signal: any, _onUpdate: any, ctx: any) {
      const installed = await ensureInstalled(pi, ctx);
      if (!installed) {
        return {
          content: [{ type: "text", text: "agent-browser is not installed. Install manually with: npm install -g agent-browser && agent-browser install" }],
          isError: true,
        };
      }

      const resolved = resolveAgentBrowser();
      if (!resolved) {
        return {
          content: [{ type: "text", text: "agent-browser binary not found" }],
          isError: true,
        };
      }

      const commandStr = params.command.trim();
      const parts = commandStr.split(/\s+/);
      const action = parts[0].toLowerCase();

      // ponytail: bypass shell wrapper, call node + JS directly
      const args = [resolved.js, ...parts];
      const result = await pi.exec(resolved.node, args, {
        signal,
        timeout: 180000,
      });

      if (result.code !== 0) {
        const errorOutput = (result.stderr || result.stdout).trim();
        return {
          content: [{ type: "text", text: `Exit ${result.code}${result.killed ? " (killed/timeout)" : ""}: ${errorOutput || "(no output)"}` }],
          isError: true,
        };
      }

      const output = result.stdout.trim();

      // Screenshot handling
      if (action === "screenshot") {
        const pathMatch = output.match(/saved to (.+)$/i);
        if (pathMatch) {
          const screenshotPath = pathMatch[1].trim();
          try {
            const imageData = readFileSync(screenshotPath);
            const base64 = imageData.toString("base64");
            const ext = extname(screenshotPath).toLowerCase();
            const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
              : ext === ".webp" ? "image/webp"
              : "image/png";
            return {
              content: [
                { type: "text", text: `Screenshot saved: ${screenshotPath}` },
                { type: "image", data: base64, mimeType },
              ],
            };
          } catch (err: any) {
            return {
              content: [{ type: "text", text: `Screenshot saved to ${screenshotPath} but could not read file: ${err.message}` }],
            };
          }
        }
      }

      return {
        content: [{ type: "text", text: output || "(no output)" }],
      };
    },
  });

  // Clean up browser on session exit
  pi.on("session_shutdown", async () => {
    try {
      const resolved = resolveAgentBrowser();
      if (resolved) {
        await pi.exec(resolved.node, [resolved.js, "close"], { timeout: 5000 });
      }
    } catch {
      // Ignore
    }
  });
}