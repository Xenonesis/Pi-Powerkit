# pi-agent-browser

LLM-driven browser automation for pi-coding-agent. Uses [agent-browser](https://www.npmjs.com/package/agent-browser) CLI under the hood.

## Features

- **Browser tool** — registered as `browser` in pi
- **Visual feedback** — screenshots returned inline, vision-capable models can see them
- **Headed mode** — open with visible browser window (`--headed` flag)
- **DOM refs** — interactive elements get refs like `@e1`, `@e2`
- **Auto-install** — if `agent-browser` missing, prompts to install

## Install

```bash
# Install agent-browser CLI globally
npm install -g agent-browser

# Install Chromium for agent-browser
agent-browser install

# Install this extension
pi install git:github.com/<you>/pi-powerkit/tree/main/packages/pi-agent-browser
```

## Usage in pi

Just ask in natural language — the LLM will use the `browser` tool:

```
"Open github.com and tell me about the top trending repos"
"Take a screenshot of example.com and describe what you see"
"Go to my app at localhost:3000 and click the login button"
```

## Commands (passed to `browser` tool)

| Command | Purpose |
|---------|---------|
| `open <url>` | Navigate to URL |
| `open <url> --headed` | Open with visible browser window |
| `snapshot -i` | Get interactive elements with `@refs` |
| `click <@ref>` | Click element |
| `fill <@ref> <text>` | Clear and type |
| `type <@ref> <text>` | Type without clearing |
| `select <@ref> <value>` | Select dropdown |
| `press <key>` | Press key (Enter, Tab, etc.) |
| `scroll <dir> [px]` | Scroll up/down/left/right |
| `get text\|url\|title [@ref]` | Get information |
| `wait <@ref\|ms>` | Wait for element or time |
| `screenshot [--full]` | Take screenshot (returns image) |
| `close` | Close browser |

## How it works

This extension wraps the `agent-browser` CLI and exposes it as the `browser` tool. The LLM can autonomously chain commands to browse, interact with, and visually inspect any web page.

## License

MIT — see [LICENSE](../../LICENSE)