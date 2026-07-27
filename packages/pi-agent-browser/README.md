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
| `snapshot [-i]` | Get interactive elements with `@ref`s |
| `click <@ref\|sel>` | Click element by ref or CSS selector |
| `fill <@ref\|sel> <text>` | Clear and type text |
| `type <@ref\|sel> <text>` | Type without clearing |
| `select <@ref\|sel> <value>` | Select dropdown by value/label |
| `check <@ref\|sel>` | Check/uncheck a checkbox |
| `hover <@ref\|sel>` | Hover over element |
| `press <key>` | Press key (Enter, Tab, Escape, Arrow, etc.) |
| `scroll <dir> [px]` | Scroll up/down/left/right/top/bottom |
| `back` | Go back in history |
| `forward` | Go forward in history |
| `reload` | Reload page |
| `url` | Get current page URL |
| `title` | Get current page title |
| `text` | Extract all visible text |
| `screenshot [path]` | Take screenshot (returns image for vision models) |
| `wait <selector\|ms>` | Wait for element to appear or time in ms |
| `wait --text "..."` | Wait for text to appear on page |
| `wait --url "**/pattern"` | Wait for URL to match pattern |
| `wait --load networkidle` | Wait for page to finish loading |
| `wait --fn "js-expr"` | Wait for JavaScript condition |
| `find <type> <target> <action> [value]` | Semantic locators — by role, text, label, placeholder, alt, testid |
| `cookies` | Get/set/clear/import cookies for auth persistence |
| `storage local` | Get/set/clear localStorage |
| `storage session` | Get/set/clear sessionStorage |
| `network` | List network requests |
| `network block <pattern>` | Block requests (e.g. images, CSS for speed) |
| `diff snapshot` | Compare current vs last snapshot |
| `diff url <url1> <url2>` | Compare two pages |
| `evaluate <js-expr>` | Run arbitrary JavaScript in page context |
| `close` | Close browser |

## How it works

This extension wraps the `agent-browser` CLI and exposes it as the `browser` tool. The LLM can autonomously chain commands to browse, interact with, and visually inspect any web page.

## License

MIT — see [LICENSE](../../LICENSE)
## QuickJS Compatibility

⚠️ This extension uses `node:child_process` and `node:fs` — it requires Node.js. NOT compatible with pi_agent_rust (QuickJS).

For pi_agent_rust, use the browser via `bash curl` or set up the agent-browser daemon manually.
