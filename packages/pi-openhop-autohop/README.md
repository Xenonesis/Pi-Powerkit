# pi-openhop-autohop

Auto-rotate the WARP exit IP when a provider free-limit wall hits.

[openhop](https://github.com/) already rotates the IP for `opencode`, but its guard only
tails `~/.local/share/opencode/log/opencode.log`. This extension closes that gap for
**pi** and **omp**: on a quota wall it runs `openhop-hop`, then re-sends `continue` so the
cut-off turn resumes on the fresh address.

## Install

```bash
pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-openhop-autohop
```

Or copy `extensions/openhop-autohop.ts` into:

```
~/.pi/agent/extensions/       (pi)
~/.omp/agent/extensions/      (omp — same file, identical extension API)
```

## Requires

`openhop` installed, with `openhop-hop` on disk:

```
%LOCALAPPDATA%\openhop\bin\openhop-hop.cmd      (Windows)
```

Missing → the extension logs a skip and never crashes a turn.

## What it does

```
message_end(stopReason="error", errorMessage ~ wall)          → hop
after_provider_response(status=429, provider ~ opencode|zen)  → hop
        ↓
  openhop-hop  →  WARP /64 rotate  →  sendUserMessage("continue")
```

- `opencode` / `zen` providers → any wall wording (`429`, `rate limit`, `quota`,
  `too many requests`) rotates.
- Other providers → only hard walls (`quota exceeded`, `free usage limit`,
  `credits exhausted`, …). A transient throttle never burns a hop.

## Notifications

| Channel | What you see |
|---|---|
| TUI toast | `OpenHop — Free limit hit — rotating IP (opencode/zen)` |
| Footer status | `openhop=rotating IP…` → `new IP live` (clears after 8s) |
| Windows toast | same text, visible when the terminal is in the background |

## Guards

- `COOLDOWN_MS = 90s` — cross-process lockfile `guard/omp_pi_hop.lock`; pi and omp both
  walling at once produces a single hop.
- `HOP_TIMEOUT_MS = 300s` — `zen_hop.py` pauses the keeper up to 180s.
- Re-entry blocked inside one process.
- Logging and UI calls are all guarded — a missing method never breaks a turn.

## Toggles

| Env var | Default | Effect |
|---|---|---|
| `OPENHOP_AUTOHOP` | `1` | `0` disables the extension entirely |
| `OPENHOP_AUTOCONTINUE` | `1` | `0` rotates only, no `continue` |
| `OPENHOP_TOAST` | `0` | `1` enables the optional desktop toast (TUI notify stays) |

Kill switch: delete the file.

## Log

```
%LOCALAPPDATA%\openhop\guard\omp_pi_hop.log
```

## Notes

- Restart pi / omp after installing; the extension loads at startup. Look for
  `loaded (cooldown 90s, autocontinue on, toast on)` in the log.
- `continue` costs one turn, same as openhop does for opencode. If the new IP is also
  burnt, the wall returns → cooldown → next attempt. No infinite loop.
- Pure JS, node builtins only (`child_process`, `fs`, `os`, `path`) — compatible with
  pi_agent_rust (QuickJS).
