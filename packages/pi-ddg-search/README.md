# pi-ddg-search

Free web search for pi using DuckDuckGo's HTML endpoint. No API key required.

## Usage

Installed as the `ddg_search` tool. The LLM can search the web:

```
> Search for "latest rust features"
> Look up pi-coding-agent documentation
```

## Install

```bash
pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-ddg-search
```

Or copy `extensions/ddg-search.ts` to `~/.pi/agent/extensions/`.

## API Key

None required. Uses DuckDuckGo's public HTML endpoint.

## QuickJS Compatibility

⚠️ Uses `node:child_process` (calls `curl`) — NOT compatible with pi_agent_rust (QuickJS).
