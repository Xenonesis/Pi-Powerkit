# pi-powerkit

> A curated collection of powerful extensions and provider configurations for [pi-coding-agent](https://pi.dev/).

[![GitHub](https://img.shields.io/badge/GitHub-Xenonesis%2FPi--Powerkit-blue?logo=github)](https://github.com/Xenonesis/Pi-Powerkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![pi](https://img.shields.io/badge/pi--coding--agent-compatible-purple)](https://pi.dev/)

## See it in action

### LLM-driven browser — describe what you want, AI does it

![Browser demo: GitHub profile](assets/demo-github.png)

### Real website analysis — find issues automatically

![Pinmark website analysis](assets/demo-pinmark.png)

## What's included

| Package | Description | Install |
|---------|-------------|---------|
| **[pi-agent-browser](./packages/pi-agent-browser)** | LLM-driven browser automation via `agent-browser` CLI. Visual feedback with vision-capable models. | `pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-agent-browser` |
| **[pi-cline-free](./packages/pi-cline-free)** | 11 verified-working Cline free models + 1 TokenRouter model. | `pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-cline-free` |
| **[pi-opencode-free](./packages/pi-opencode-free)** | Dynamic OpenCode Zen free model fetcher with cached lookup. | `pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-opencode-free` |

## Install everything

```bash
pi install git:github.com/Xenonesis/Pi-Powerkit
```

## Features

- 🤖 **LLM-driven browser** — your AI can browse the web, take screenshots, click buttons, fill forms
- 🆓 **20+ free models** — across Cline, OpenCode Zen, TokenRouter
- 👁️ **Visual feedback** — vision-capable models can see and describe screenshots
- ⚡ **Cached & dynamic** — instant startup, auto-refreshes free model lists
- 🔒 **Self-hosted** — everything runs locally, your data stays with you
- 🔌 **Modular** — install only what you need

## Quick start

```bash
# 1. Install [pi-coding-agent](https://pi.dev/)
# 2. Set API keys (free tiers available everywhere)
export CLINE_API_KEY="sk_..."
export OPENCODE_API_KEY="sk-..."
export TOKENROUTER_API_KEY="sk-..."
export NVIDIA_NIM_API_KEY="nvapi-..."   # optional

# 3. Install packages
pi install git:github.com/Xenonesis/Pi-Powerkit

# 4. Restart pi, then /model to see new providers
```

## Use cases

### 1. Browse and analyze websites
```
> Open https://github.com/Xenonesis and tell me about the projects
> Visit https://xenonesis.github.io/Pinmark and list all the UX issues you find
```

### 2. Access free coding models
```
/model
# See 11+ Cline models, OpenCode free models, TokenRouter, etc.
```

### 3. Visual testing
```
> Open my app at localhost:3000 and take a screenshot. Does the layout look correct?
```

## How it works

### pi-agent-browser
Wraps the [`agent-browser`](https://www.npmjs.com/package/agent-browser) CLI and exposes it as the `browser` tool in pi. The LLM can autonomously chain commands:
```
browser("open https://...")     # navigate
browser("snapshot -i")          # get interactive elements with refs
browser("click @e5")            # click an element
browser("get text")             # extract page text
browser("screenshot")           # visual feedback (vision models)
```

### pi-cline-free
Registers 11 verified-working Cline free models + 1 TokenRouter model. API keys read from environment variables (`CLINE_API_KEY`, `TOKENROUTER_API_KEY`).

### pi-opencode-free
Fetches free models from OpenCode Zen API at startup, caches them to `~/.pi/agent/cache/opencode-free.json`, refreshes in background every hour. API key from `OPENCODE_API_KEY`.

## Setup details

See individual package READMEs:
- [pi-agent-browser setup](./packages/pi-agent-browser/README.md)
- [pi-cline-free setup](./packages/pi-cline-free/README.md)
- [pi-opencode-free setup](./packages/pi-opencode-free/README.md)
- [NVIDIA NIM setup](./examples/README.md)

## Contributing

Issues and PRs welcome! Each package is independent — feel free to improve one without touching others.

## License

MIT — see [LICENSE](./LICENSE)