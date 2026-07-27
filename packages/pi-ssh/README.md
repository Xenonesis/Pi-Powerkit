# pi-ssh

SSH remote execution for pi — delegates `read`/`write`/`edit`/`bash` tools to a remote machine.

## Usage

```bash
pi -e ./ssh.ts --ssh user@host
pi -e ./ssh.ts --ssh user@host:/remote/path
```

## Install

```bash
pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-ssh
```

## Requirements

- SSH key-based auth (no password prompts)
- bash on the remote machine

## QuickJS Compatibility

⚠️ Uses `node:child_process` (spawn) and Pi's full extension API — NOT compatible with pi_agent_rust (QuickJS).
