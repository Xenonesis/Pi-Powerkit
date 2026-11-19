import { HermesError } from './errors.js'
import { type HermesCli, proxyStatus, startProxy } from './hermes.js'

export const DEFAULT_PORT = 8645
export const DEFAULT_HOST = '127.0.0.1'
/** The proxy accepts any bearer and attaches the real credential itself. */
export const PROXY_PLACEHOLDER_KEY = 'hermes-local'

export function proxyBaseUrl(port = DEFAULT_PORT): string {
    return `http://${DEFAULT_HOST}:${port}/v1`
}

async function probe(baseUrl: string, signal?: AbortSignal): Promise<boolean> {
    try {
        const response = await fetch(`${baseUrl}/models`, {
            headers: { authorization: `Bearer ${PROXY_PLACEHOLDER_KEY}` },
            signal: signal ?? AbortSignal.timeout(4000)
        })
        return response.ok
    } catch {
        return false
    }
}

export type ProxyState = {
    baseUrl: string
    port: number
    reachable: boolean
    started: boolean
    detail: string
}

/**
 * Resolve a reachable local proxy. Checks health first; only spawns
 * `hermes proxy start` when explicitly allowed and nothing is listening.
 */
export async function ensureProxy(
    cli: HermesCli | undefined,
    options: { port?: number; allowStart?: boolean; signal?: AbortSignal } = {}
): Promise<ProxyState> {
    const port = options.port ?? DEFAULT_PORT
    const baseUrl = proxyBaseUrl(port)

    if (await probe(baseUrl, options.signal)) {
        return { baseUrl, port, reachable: true, started: false, detail: 'proxy already listening' }
    }
    if (!cli) {
        throw new HermesError(
            'hermes-not-installed',
            `No proxy at ${baseUrl} and Hermes CLI not found`,
            'Install Hermes Agent, then run: hermes proxy start --provider nous'
        )
    }

    const upstream = proxyStatus(cli)
    if (!upstream.upstreamReady) {
        throw new HermesError(
            'auth-expired',
            'Nous Portal upstream is not ready',
            upstream.detail || 'Run `hermes portal login` to re-authorise.'
        )
    }

    if (options.allowStart === false) {
        throw new HermesError(
            'proxy-unreachable',
            `No proxy at ${baseUrl}`,
            `Start it with: hermes proxy start --provider nous --port ${port}`
        )
    }

    const started = startProxy(cli, port)
    if (!started.ok) throw started.error

    const deadline = Date.now() + 15_000
    while (Date.now() < deadline) {
        options.signal?.throwIfAborted()
        if (await probe(baseUrl, options.signal)) {
            return { baseUrl, port, reachable: true, started: true, detail: 'proxy started by extension' }
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new HermesError(
        'proxy-start-failed',
        `Proxy did not answer at ${baseUrl} within 15s`,
        'Check `hermes proxy status` in a terminal for the real error.'
    )
}