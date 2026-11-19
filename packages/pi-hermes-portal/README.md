# pi-hermes-portal

Hermes / Nous Portal **free-tier** models inside **Pi** and **OMP**, through the official
Hermes subscription proxy. No API-key purchase, no token extraction, no config rewriting.

```
pi-hermes-portal  →  http://127.0.0.1:8645/v1 (hermes proxy start)  →  Nous Portal (your free account)
```

## Requirements

- [Hermes Agent](https://portal.nousresearch.com) installed and logged in (`hermes portal login`)
- Pi `>= 1.5` or OMP `>= 19` (both load Pi extensions)

## Install

```bash
pi install npm:pi-hermes-portal
```

```bash
omp plugin install npm:pi-hermes-portal
```

Then check it:

```
/hermes status
/hermes models
/hermes test
```

Pick a model with Pi's `/model` (or OMP's `/model`) — the provider is `hermes-portal`.

## Commands

| Command | What it does |
|---|---|
| `/hermes status` | Hermes path/version, portal login state, proxy reachability, loaded models |
| `/hermes models` | Every zero-priced model the proxy reports, with tools/reasoning/ctx |
| `/hermes models refresh` | Re-fetch the catalogue |
| `/hermes refresh` | Re-probe the proxy and re-register models |
| `/hermes test` | Real completion against a free model; prints cost and billing source |
| `/hermes setup` | Checks login, starts the proxy, loads models |
| `/hermes quota` | Explains that the proxy exposes no quota endpoint |

## Free models

Only models whose proxy pricing is **exactly zero** for both prompt and completion are
registered. Missing pricing is treated as **paid** (fail closed), so a paid model can
never be selected by accident.

At time of writing, 5 models qualified:

| Model | ctx | max out | tools | reasoning |
|---|---|---|---|---|
| `stepfun/step-3.7-flash:free` | 262K | 256K | yes | yes |
| `upstage/solar-mini4:free` | 524K | 131K | yes | yes |
| `meituan/longcat-2.5:free` | 1M | 131K | yes | no |
| `qwen/qwen4-max:free` | 1M | 131K | yes | yes |
| `tencent/hy4-flash:free` | 1M | 66K | yes | yes |

Models on Nous Portal's published `freeRecommendedModels` list are labelled normally;
the rest are labelled `(zero-priced)` because they are free-priced today but not on the
official list and can change without notice.

Free-tier availability is decided server-side. `cost: 0` and
`cost_details.source: "free_path"` in the response confirm a zero-cost call.

## OMP: selecting a model

OMP parses `:` in `--model` as a thinking-level suffix, so
`--model hermes-portal/upstage/solar-mini4:free` is mis-read as thinking level `free`.
Use either of these instead:

```
/model            # interactive picker lists all 5
```

```yaml
# ~/.omp/agent/config.yml
modelRoles:
  default: hermes-portal/upstage/solar-mini4:free
```

This is an OMP CLI parsing quirk, not a limitation of the provider.

## Behaviour and guarantees

- **No config rewriting.** Pi's `models.json` and OMP's `models.yml` are never modified;
  the provider is registered at runtime.
- **No credential handling.** The proxy attaches your real Nous credential; this package
  sends the placeholder bearer `hermes-local` and never reads or logs a token.
- **Localhost only.** The proxy is started on `127.0.0.1`, never `0.0.0.0`.
- **Shared proxy.** The proxy is left running on session end so Pi and OMP can share it.
  Repeated starts are avoided by probing `/v1/models` first.
- **No paid fallback.** There is no automatic model switching. `402`/`429` surface as
  `quota-exhausted` / `rate-limited` with the free model unchanged.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `hermes-not-installed` | Install Hermes Agent, or put `hermes` on PATH |
| `NOT logged in` | Run `hermes portal login` in your own terminal, then `/hermes refresh` |
| `proxy-unreachable` | `hermes proxy start --provider nous --port 8645` |
| `HTTP 429 ... temporarily at capacity` | Upstream free capacity is busy; retry or try another free model |
| `HTTP 401/403` | Portal session expired → `hermes portal login` |
| `no-free-models` | Free-tier catalogue changed; check https://portal.nousresearch.com |
| Port busy | `HERMES_PORTAL_PORT=8646` before starting the agent |

## Uninstall / rollback

```bash
pi uninstall npm:pi-hermes-portal
```

```bash
omp plugin uninstall pi-hermes-portal
```

Nothing else needs undoing: no config files, auth files or model caches were changed.
To stop the shared proxy: `hermes proxy stop` (or close the `hermes proxy start` terminal).

## Development

```bash
npm test          # bun test, mocked fetch — no live free-tier access needed
npm run typecheck
```

Tests cover the free-pricing gate (including unknown pricing), model mapping, proxy
health/startup errors, and HTTP status → actionable error mapping.

## License

MIT. See [LICENSE](LICENSE).