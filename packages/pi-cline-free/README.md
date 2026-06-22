# pi-cline-free

11 verified-working Cline free models + 1 TokenRouter model, registered as the `cline` and `tokenrouter` providers in pi.

## Features

- **11 Cline free models** — all tested working as of last update
- **1 TokenRouter model** — Minimax-M3
- **Free** — no cost for any model
- **Verified** — only models that returned 200 OK included

## Install

```bash
# Set your Cline API key
export CLINE_API_KEY="sk_..."

# Set TokenRouter API key (optional)
export TOKENROUTER_API_KEY="sk_..."

# Install extension
pi install git:github.com/<you>/pi-powerkit/tree/main/packages/pi-cline-free

# Restart pi, then /model to see providers
```

## Models

### Cline (11 verified)
- `openrouter/owl-alpha`
- `nvidia/nemotron-3-ultra-550b-a55b:free`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `google/gemma-4-26b-a4b-it:free`
- `google/gemma-4-31b-it:free`
- `nvidia/nemotron-3-nano-30b-a3b:free`
- `openrouter/free`
- `openai/gpt-oss-120b:free`
- `liquid/lfm-2.5-1.2b-instruct:free`
- `nex-agi/nex-n2-pro:free`
- `nvidia/nemotron-nano-12b-v2-vl:free`

### TokenRouter (1)
- `MiniMax-M3`

## Get API keys

- **Cline**: https://app.cline.bot/ (free tier available)
- **TokenRouter**: https://tokenrouter.com/

## License

MIT — see [LICENSE](../../LICENSE)