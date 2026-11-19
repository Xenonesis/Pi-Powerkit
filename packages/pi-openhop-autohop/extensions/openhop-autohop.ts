/**
 * openhop-autohop — rotate the WARP /64 when omp/pi hit a free-limit wall.
 *
 * openhop's own guard only tails ~/.local/share/opencode/log/opencode.log, so omp and pi
 * get no automatic IP rotation. This extension closes that gap: on a quota wall it runs
 * `openhop-hop` (WARP /64 rotation) and re-sends "continue" so the cut-off turn resumes
 * on the fresh address.
 *
 * Same file works in Pi and omp (identical extension API).
 *
 * Kill switch:   set OPENHOP_AUTOHOP=0, or delete this file.
 * Auto-continue: set OPENHOP_AUTOCONTINUE=0 to only rotate.
 * Toast:         set OPENHOP_TOAST=1 to enable the optional Windows desktop notification.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const COOLDOWN_MS = 90_000;        // openhop's guard uses 75s; a bit more for the extra round-trip
const HOP_TIMEOUT_MS = 300_000;    // zen_hop.py pauses the keeper up to 180s
const SKIP_NOTIFY_MS = 30_000;     // at most one "cooldown" toast per 30s
const AUTOCONTINUE = (process.env.OPENHOP_AUTOCONTINUE ?? "1") !== "0";
const ENABLED = (process.env.OPENHOP_AUTOHOP ?? "1") !== "0";
const TOAST = (process.env.OPENHOP_TOAST ?? "0") !== "0";

const LOCAL = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
const HOP_DIR = join(LOCAL, "openhop");
const GUARD_DIR = join(HOP_DIR, "guard");
const HOP_CMD = join(HOP_DIR, "bin", "openhop-hop.cmd");
const LOCK = join(GUARD_DIR, "omp_pi_hop.lock");   // shared with the other app: one hop at a time
const LOG = join(GUARD_DIR, "omp_pi_hop.log");
const STATUS_KEY = "openhop";

/** Quota-wall wording seen from the OpenCode/Zen free tier and similar providers. */
const WALL =
  /free usage limit|free-tier usage limit|free usage exceeded|quota exceeded|quota_exceeded|resource_exhausted|credits exhausted|usage limit reached|rate limit exceeded|rate_limit_exceeded|too many requests|status[=: ]?429|code=429|\b429\b/i;

/** A hard wall worth rotating for, as opposed to a transient throttle. */
const HARD_WALL =
  /free usage limit|free-tier usage limit|free usage exceeded|quota exceeded|quota_exceeded|resource_exhausted|credits exhausted|usage limit reached|rate limit exceeded|rate_limit_exceeded/i;

let busy = false;
let lastSkipNotify = 0;

function log(msg: string): void {
  const line = `${new Date().toISOString()} ${msg}\n`;
  try {
    mkdirSync(GUARD_DIR, { recursive: true });
    appendFileSync(LOG, line);
  } catch {
    /* logging must never break a turn */
  }
}

/* ------------------------------------------------------------------ *
 * UI helpers — every call is guarded; a missing method must never
 * break a turn (print/JSON modes have no UI, and omp builds vary).
 * ------------------------------------------------------------------ */

function uiNotify(ctx: any, msg: string, level: "info" | "warning" | "error" = "info"): void {
  try {
    if (typeof ctx?.ui?.notify === "function") ctx.ui.notify(msg, level);
  } catch {
    /* ignore */
  }
}

function uiStatus(ctx: any, text: string | undefined): void {
  try {
    if (typeof ctx?.ui?.setStatus === "function") ctx.ui.setStatus(STATUS_KEY, text);
  } catch {
    /* ignore */
  }
}

/** Desktop toast, so the notification is visible when the terminal is in the background. */
function toast(title: string, body: string): void {
  if (!TOAST) return;
  try {
    const safe = (s: string) => s.replace(/['"`$\\]/g, "").slice(0, 120);
    const ps = [
      "$ErrorActionPreference='SilentlyContinue'",
      "[Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime]>$null",
      "[Windows.Data.Xml.Dom.XmlDocument,Windows.Data.Xml.Dom,ContentType=WindowsRuntime]>$null",
      "$t=@'",
      `<toast><visual><binding template="ToastGeneric"><text>${safe(title)}</text><text>${safe(body)}</text></binding></visual></toast>`,
      "'@",
      "$x=New-Object Windows.Data.Xml.Dom.XmlDocument",
      "$x.LoadXml($t)",
      "$n=New-Object Windows.UI.Notifications.ToastNotification $x",
      "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show($n)",
    ].join("; ");
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", ps],
      { stdio: "ignore", windowsHide: true, detached: true },
    );
    child.on("error", () => {});
    child.unref();
  } catch {
    /* ignore */
  }
}

/** One notification on every channel. */
function announce(ctx: any, title: string, body: string, level: "info" | "warning" | "error"): void {
  uiNotify(ctx, `${title} — ${body}`, level);
  toast(title, body);
}

/* ------------------------------------------------------------------ */

function cooldownLeft(): number {
  try {
    return Math.max(0, COOLDOWN_MS - (Date.now() - statSync(LOCK).mtimeMs));
  } catch {
    return 0;
  }
}

function touchLock(): void {
  try {
    mkdirSync(GUARD_DIR, { recursive: true });
    writeFileSync(LOCK, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** "provider/model" for the model in play, lowercased. Message fields win, ctx fills the gaps. */
function label(ctx: any, m?: any): string {
  const pick = (...v: any[]) => v.find((x) => typeof x === "string" && x.length > 0) ?? "?";
  const provider = pick(m?.provider, m?.providerID, ctx?.model?.provider, ctx?.model?.providerID);
  const model = pick(m?.model, m?.modelID, m?.id, ctx?.model?.id, ctx?.model?.modelID);
  return `${provider}/${model}`.toLowerCase();
}

/** OpenCode / Zen family — the providers whose free tier is counted per IP. */
function isOurs(id: string): boolean {
  return /opencode|\bzen\b/.test(id);
}

function runHop(): Promise<number> {
  return new Promise<number>((resolve) => {
    try {
      const child = spawn("cmd.exe", ["/c", HOP_CMD], {
        stdio: "ignore",
        windowsHide: true,
        cwd: HOP_DIR,
      });
      const timer = setTimeout(() => {
        try {
          child.kill();
        } catch {
          /* ignore */
        }
        resolve(-1);
      }, HOP_TIMEOUT_MS);
      child.on("exit", (code) => {
        clearTimeout(timer);
        resolve(code ?? -1);
      });
      child.on("error", () => {
        clearTimeout(timer);
        resolve(-1);
      });
    } catch {
      resolve(-1);
    }
  });
}

async function resumeTurn(pi: any, ctx: any): Promise<void> {
  if (!AUTOCONTINUE) return;
  try {
    if (typeof pi?.sendUserMessage !== "function") {
      log("continue skipped: sendUserMessage unavailable");
      return;
    }
    if (typeof ctx?.isIdle === "function" && !ctx.isIdle()) {
      log("continue skipped: agent still busy");
      return;
    }
    await new Promise((r) => setTimeout(r, 1500)); // let the new epoch settle
    pi.sendUserMessage("continue");
    log("sent continue");
  } catch (e: any) {
    log(`continue failed: ${e?.message ?? e}`);
  }
}

async function hop(reason: string, ctx: any, pi: any): Promise<boolean> {
  if (busy) {
    log(`skip (${reason}) — already hopping in this process`);
    return false;
  }
  const wait = cooldownLeft();
  if (wait > 0) {
    const secs = Math.round(wait / 1000);
    log(`skip (${reason}) — cooldown ${secs}s`);
    uiStatus(ctx, `cooldown ${secs}s`);
    if (Date.now() - lastSkipNotify > SKIP_NOTIFY_MS) {
      lastSkipNotify = Date.now();
      announce(ctx, "OpenHop", `IP rotated moments ago — retrying in ${secs}s`, "info");
    }
    return false;
  }
  if (!existsSync(HOP_CMD)) {
    log(`skip (${reason}) — ${HOP_CMD} missing`);
    announce(ctx, "OpenHop", "openhop-hop not found — is openhop installed?", "error");
    return false;
  }

  busy = true;
  touchLock();
  log(`wall (${reason}) — rotating`);
  uiStatus(ctx, "rotating IP…");
  announce(ctx, "OpenHop", `Free limit hit — rotating IP (${reason})`, "warning");

  try {
    const code = await runHop();
    const ok = code === 0;
    log(ok ? "hop ok" : `hop failed (exit ${code})`);
    if (ok) {
      uiStatus(ctx, "new IP live");
      announce(ctx, "OpenHop", "New IP live — resuming turn", "info");
      await resumeTurn(pi, ctx);
      setTimeout(() => uiStatus(ctx, undefined), 8000);
    } else {
      uiStatus(ctx, undefined);
      announce(ctx, "OpenHop", `Rotation failed (exit ${code}) — run openhop-hop manually`, "error");
    }
    return ok;
  } finally {
    busy = false;
    touchLock(); // start the cooldown from when the hop actually finished
  }
}

export default function (pi: any) {
  if (!ENABLED) {
    log("disabled by OPENHOP_AUTOHOP=0");
    return;
  }
  log(`loaded (cooldown ${COOLDOWN_MS / 1000}s, autocontinue ${AUTOCONTINUE ? "on" : "off"}, toast ${TOAST ? "on" : "off"})`);

  pi.on("session_start", (_event: any, ctx: any) => {
    uiStatus(ctx, undefined);
  });

  // Raw HTTP status: only rotate for the per-IP free-tier providers.
  pi.on("after_provider_response", (event: any, ctx: any) => {
    if (event?.status !== 429) return;
    const id = label(ctx);
    // The openhop Guard already tails OpenCode's own log and handles opencode-z.
    // A second hop races that guard and generates duplicate failure notifications.
    if (/^opencode-z\//.test(id)) return;
    if (!isOurs(id)) return;
    void hop(`HTTP 429 on ${id}`, ctx, pi);
  });

  // The normalized failure every provider path ends on.
  pi.on("message_end", (event: any, ctx: any) => {
    const m = event?.message;
    if (!m || m.role !== "assistant") return;
    if (m.stopReason !== "error") return;

    const text = String(m.errorMessage ?? "");
    if (!WALL.test(text)) return;

    const id = label(ctx, m);
    // OpenCode's background Guard already handles this provider from opencode.log.
    if (/^opencode-z\//.test(id)) return;
    // Rotating only helps where the counter is per-IP. For other providers require
    // explicit hard-wall wording so a transient throttle does not burn a hop.
    if (!isOurs(id) && !HARD_WALL.test(text)) return;

    void hop(`${id}`, ctx, pi);
  });
}
