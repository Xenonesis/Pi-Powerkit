# Setup examples

## NVIDIA NIM models

Copy `examples/models.json` to `~/.pi/agent/models.json`:

```bash
cp examples/models.json ~/.pi/agent/models.json
```

Then set your NVIDIA NIM API key:

```bash
# Linux/macOS
export NVIDIA_NIM_API_KEY="nvapi-..."

# Windows PowerShell
$env:NVIDIA_NIM_API_KEY = "nvapi-..."
```

## Get API keys

| Provider | URL | Free Tier |
|----------|-----|-----------|
| Cline | https://app.cline.bot/ | Yes |
| OpenCode Zen | https://opencode.ai/zen/ | Yes |
| TokenRouter | https://tokenrouter.com/ | Yes |
| NVIDIA NIM | https://build.nvidia.com/ | Yes (credits) |