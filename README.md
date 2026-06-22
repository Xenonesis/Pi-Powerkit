# pi-powerkit

A curated collection of powerful extensions and provider configurations for [pi-coding-agent](https://pi.dev/).

## What's included

| Package | Description | Install |
|---------|-------------|---------|
| **[pi-agent-browser](./packages/pi-agent-browser)** | LLM-driven browser automation via `agent-browser` CLI. Visual feedback with vision-capable models. | `pi install git:github.com/<you>/pi-powerkit/tree/main/packages/pi-agent-browser` |
| **[pi-cline-free](./packages/pi-cline-free)** | 11 verified-working Cline free models + 1 TokenRouter model. | `pi install git:github.com/<you>/pi-powerkit/tree/main/packages/pi-cline-free` |
| **[pi-opencode-free](./packages/pi-opencode-free)** | Dynamic OpenCode Zen free model fetcher with cached lookup. | `pi install git:github.com/<you>/pi-powerkit/tree/main/packages/pi-opencode-free` |

## Install everything

```bash
pi install git:github.com/<you>/pi-powerkit
```

## Features

- **LLM-driven browser** — your AI can browse the web, take screenshots, click buttons
- **Free models** — access 20+ free coding models across Cline, OpenCode, TokenRouter
- **Visual feedback** — vision-capable models can see and describe screenshots
- **Self-hosted** — everything runs locally, your data stays with you

## Setup

1. Install [pi-coding-agent](https://pi.dev/)
2. Install the package(s) you want (see table above)
3. Add your API keys to environment variables (see individual package READMEs)
4. Restart pi and use `/model` to see new providers

## License

MIT — see [LICENSE](./LICENSE)