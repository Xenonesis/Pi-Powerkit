import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'

import { HermesError } from './errors.js'

export type HermesCli = {
    bin: string
    version?: string
}

type RunResult = { ok: true; stdout: string } | { ok: false; error: HermesError }

const CANDIDATE_SUFFIXES =
    process.platform === 'win32' ? ['hermes.cmd', 'hermes.exe', 'hermes'] : ['hermes']

function localAppDataHermes(): string | undefined {
    const root = process.env.LOCALAPPDATA
    if (!root) return undefined
    const bin = join(root, 'hermes', 'bin')
    for (const suffix of CANDIDATE_SUFFIXES) {
        const candidate = join(bin, suffix)
        if (existsSync(candidate)) return candidate
    }
    return undefined
}

/** Locate the Hermes CLI without ever reading or mutating its auth files. */
export function findHermes(): HermesCli | undefined {
    const bundled = localAppDataHermes()
    if (bundled) return { bin: bundled }

    const pathEntries = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
    for (const dir of pathEntries) {
        for (const suffix of CANDIDATE_SUFFIXES) {
            const candidate = join(dir, suffix)
            if (existsSync(candidate)) return { bin: candidate }
        }
    }
    return undefined
}

export function runHermes(cli: HermesCli, args: string[], timeoutMs = 30_000): RunResult {
    const isBatchFile = /\.(cmd|bat)$/i.test(cli.bin)
    const command = isBatchFile ? ['/d', '/c', cli.bin, ...args] : [cli.bin, ...args]
    const result = spawnSync(process.env.ComSpec ?? 'cmd.exe', command, {
        encoding: 'utf8',
        timeout: timeoutMs,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
    })

    if (result.error) {
        return {
            ok: false,
            error: new HermesError(
                'hermes-not-installed',
                `Could not run Hermes CLI (${result.error.message})`,
                'Install Hermes Agent or check that `hermes` is on PATH.'
            )
        }
    }
    if (result.signal) {
        return { ok: false, error: new HermesError('proxy-start-failed', `Hermes CLI killed by ${result.signal}`) }
    }

    const stdout = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    return { ok: true, stdout }
}

export function requireHermes(): HermesCli {
    const cli = findHermes()
    if (!cli) {
        throw new HermesError(
            'hermes-not-installed',
            'Hermes Agent CLI not found',
            'Install Hermes Agent (https://portal.nousresearch.com) or add `hermes` to PATH.'
        )
    }
    return cli
}

export function hermesVersion(cli: HermesCli): string | undefined {
    const result = runHermes(cli, ['--version'], 20_000)
    if (!result.ok) return undefined
    return result.stdout.split('\n')[0]?.trim() || undefined
}

/** `hermes portal status` / `hermes portal info` report the OAuth session state. */
export function portalStatus(cli: HermesCli): { loggedIn: boolean; detail: string } {
    const result = runHermes(cli, ['portal', 'status'])
    if (!result.ok) return { loggedIn: false, detail: result.error.message }
    const loggedIn = /Auth:\s*[✓✓]?\s*logged in/i.test(result.stdout) || /logged in/i.test(result.stdout)
    return { loggedIn, detail: result.stdout.split('\n').slice(0, 12).join('\n') }
}

export type ProxyStatus = {
    running: boolean
    upstreamReady: boolean
    bearerExpiry?: string
    detail: string
}

/** `hermes proxy status` lists upstream readiness; it never starts a server. */
export function proxyStatus(cli: HermesCli): ProxyStatus {
    const result = runHermes(cli, ['proxy', 'status'])
    if (!result.ok) {
        return { running: false, upstreamReady: false, detail: result.error.message }
    }
    const upstreamReady = /\[\s*nous\s*\]\s*.*ready/i.test(result.stdout)
    const expiry = result.stdout.match(/bearer expires ([0-9T:+\-.]+)/i)?.[1]
    return {
        running: false,
        upstreamReady,
        bearerExpiry: expiry,
        detail: result.stdout.split('\n').filter(Boolean).slice(0, 8).join('\n')
    }
}

/**
 * Start the official subscription proxy via the documented CLI.
 * Only ever binds the documented default host (127.0.0.1).
 * The process is detached so it survives the coding agent's session.
 */
export function startProxy(cli: HermesCli, port = 8645): RunResult {
    const spawn = spawnSync(
        process.env.ComSpec ?? 'cmd.exe',
        [
            '/d',
            '/c',
            'start',
            '/b',
            '',
            cli.bin,
            'proxy',
            'start',
            '--provider',
            'nous',
            '--port',
            String(port)
        ],
        { encoding: 'utf8', timeout: 20_000, windowsHide: true }
    )
    if (spawn.error) {
        return {
            ok: false,
            error: new HermesError(
                'proxy-start-failed',
                `Could not start Hermes proxy (${spawn.error.message})`,
                'Run manually: hermes proxy start --provider nous --port 8645'
            )
        }
    }
    return { ok: true, stdout: `${spawn.stdout ?? ''}${spawn.stderr ?? ''}`.trim() }
}