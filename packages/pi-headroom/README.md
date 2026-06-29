# pi-headroom

Headroom context compression extension for Pi coding agent.

## What it does

Compresses context (tool outputs, logs, conversation history) before it reaches the LLM, saving **60–95% tokens**.

## Tools

| Tool | Description |
|------|-------------|
| `headroom.compress` | Compress text/messages via Headroom proxy or cloud |
| `headroom.status` | Check if Headroom server is reachable |

## Setup

### 1. Install Headroom

**Option A: Headroom Cloud**
```bash
pip install "headroom-ai[all]"
headroom login
```

**Option B: Local Proxy**
```bash
git clone https://github.com/headroomlabs-ai/headroom.git
cd headroom
cargo build --release
headroom proxy start
```

### 2. Install in Pi

```bash
cd ~/.pi/agent
npm install headroom-ai
```

### 3. Configure Extension

Add to `settings.json`:
```json
{
  "extensions": ["pi-headroom"]
}
```

Or use via `pi install` if published to npm.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `HEADROOM_API_URL` | Proxy URL (default: `http://127.0.0.1:8787`) |
| `HEADROOM_API_KEY` | Cloud API key (optional for local proxy) |

## Usage

Once installed, use the tools in pi:
```
Use headroom.compress to compress this long context
```

## Packages

| Package | Install |
|---------|---------|
| npm | `npm install pi-headroom` |
| GitHub | `git:github.com/Xenonesis/Pi-Powerkit#packages/pi-headroom` |
