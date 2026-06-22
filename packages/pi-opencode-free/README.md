# pi-opencode-free

Dynamic OpenCode Zen free model fetcher for pi. Fetches free models from OpenCode API at startup, caches them, and registers them as the `opencode` provider.

## Features

- **Dynamic fetch** — new free models auto-appear
- **Cached** — instant startup (<100ms after first run)
- **Background refresh** — non-blocking cache update every hour
- **Vision-capable models** — `mimo-v2.5-free` has image input
- **Fallback** — uses known defaults if API fails

## Install

```bash
# Set your OpenCode Zen API key
export OPENCODE_API_KEY="sk-..."

# Install extension
pi install git:github.com/<you>/pi-powerkit/tree/main/packages/pi-opencode-free

# Restart pi, then /model to see provider
```

## Get API key

https://opencode.ai/zen/ — sign up for free tier.

## How it works

1. First startup: fetches `/models` from OpenCode, populates cache
2. Subsequent startups: reads from cache (instant)
3. Background: refreshes cache every hour
4. Registers all `*-free` models as the `opencode` provider

## Cache location

`~/.pi/agent/cache/opencode-free.json` — auto-managed, safe to delete.

## License

MIT — see [LICENSE](../../LICENSE)