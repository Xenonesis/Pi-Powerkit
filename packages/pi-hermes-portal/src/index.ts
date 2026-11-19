import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'

import { modelsCommand, registerHermesCommands, testCommand } from './commands/hermes.js'
import { describe, HermesError } from './core/errors.js'
import {
    type HermesCli,
    findHermes,
    hermesVersion,
    portalStatus,
    proxyStatus,
    startProxy
} from './core/hermes.js'
import { type HermesModel, fetchFreeModels, modelLines, toPiModel } from './core/models.js'
import { DEFAULT_PORT, ensureProxy, proxyBaseUrl } from './core/proxy.js'

const PROVIDER_ID = 'hermes-portal'
const PORT = Number.parseInt(process.env.HERMES_PORTAL_PORT ?? '', 10) || DEFAULT_PORT

type Runtime = {
    cli?: HermesCli
    baseUrl: string
    models: HermesModel[]
    error?: string
}

export default async function hermesPortal(pi: ExtensionAPI): Promise<void> {
    const runtime: Runtime = { cli: findHermes(), baseUrl: proxyBaseUrl(PORT), models: [] }

    const register = () => {
        pi.registerProvider(PROVIDER_ID, {
            name: 'Hermes (Nous Portal free)',
            baseUrl: runtime.baseUrl,
            // The local proxy accepts any bearer and injects the real credential.
            apiKey: 'hermes-local',
            api: 'openai-completions',
            authHeader: true,
            models: runtime.models.map(toPiModel),
            async refreshModels({ signal }) {
                const free = await fetchFreeModels(runtime.baseUrl, { signal })
                runtime.models = free
                runtime.error = undefined
                return free.map(toPiModel)
            }
        })
    }

    async function refresh(options: { allowStart?: boolean } = {}) {
        const proxy = await ensureProxy(runtime.cli, { port: PORT, allowStart: options.allowStart })
        runtime.baseUrl = proxy.baseUrl
        runtime.models = await fetchFreeModels(proxy.baseUrl)
        runtime.error = undefined
        register()
        return { baseUrl: proxy.baseUrl, port: proxy.port, models: runtime.models, started: proxy.started }
    }

    register()

    // Surface the model list before --model is resolved; failure must not block startup.
    await refresh({ allowStart: true }).catch((error: unknown) => {
        runtime.error = describe(error)
    })

    pi.on('session_start', async (_event, ctx: ExtensionContext) => {
        if (runtime.models.length > 0) return
        try {
            await refresh({ allowStart: true })
        } catch (error) {
            ctx.ui.notify(`hermes-portal: ${describe(error)}`, 'warning')
        }
    })

    const statusCommand = async (): Promise<string> => {
        const auth = runtime.cli ? portalStatus(runtime.cli) : { loggedIn: false, detail: 'CLI not found' }
        const upstream = runtime.cli ? proxyStatus(runtime.cli) : undefined
        let reachable = false
        let detail = runtime.error ?? 'not checked'
        try {
            const proxy = await ensureProxy(runtime.cli, { port: PORT, allowStart: false })
            reachable = proxy.reachable
            detail = proxy.detail
        } catch (error) {
            detail = describe(error)
        }

        const lines = [
            `hermes cli:      ${runtime.cli ? runtime.cli.bin : 'not found'}`,
            `hermes version:  ${runtime.cli ? (hermesVersion(runtime.cli) ?? 'unknown') : 'n/a'}`,
            `portal auth:     ${auth.loggedIn ? 'logged in' : 'NOT logged in (run /hermes setup)'}`,
            `upstream ready:  ${upstream?.upstreamReady ? 'yes' : 'no'}`,
            `bearer expires:  ${upstream?.bearerExpiry ?? 'unknown'}`,
            `proxy url:       ${runtime.baseUrl}`,
            `proxy reachable: ${reachable ? 'yes' : 'no'}`,
            `models loaded:   ${runtime.models.length}`
        ]
        if (!reachable) lines.push('', `detail: ${detail}`)
        return [...lines, '', ...modelLines(runtime.models)].join('\n')
    }

    const setupCommand = async (): Promise<string> => {
        if (!runtime.cli) {
            return [
                'Hermes Agent CLI not found.',
                '',
                'Install it, then re-run /hermes setup:',
                '  https://portal.nousresearch.com'
            ].join('\n')
        }
        const before = portalStatus(runtime.cli)
        const lines = [`hermes cli: ${runtime.cli.bin}`, `portal auth before: ${before.loggedIn ? 'ok' : 'missing'}`]

        if (!before.loggedIn) {
            lines.push(
                '',
                'The browser login must run in your own terminal (the extension cannot drive it):',
                '',
                '  hermes portal login',
                '',
                'Then run /hermes refresh.'
            )
            return lines.join('\n')
        }

        const started = startProxy(runtime.cli, PORT)
        lines.push(`proxy start: ${started.ok ? 'command issued' : describe(started.error)}`)
        try {
            const result = await refresh()
            lines.push(`proxy reachable: yes (${result.baseUrl})`, `models: ${result.models.length}`)
            lines.push('', ...modelLines(result.models))
        } catch (error) {
            lines.push(`refresh failed: ${describe(error)}`)
        }
        return lines.join('\n')
    }

    const refreshCommand = async (): Promise<string> => {
        try {
            const result = await refresh()
            const note = result.started ? ' (proxy was started)' : ''
            return [`Refreshed${note}: ${result.models.length} Hermes free model(s) at ${result.baseUrl}.`, '', ...modelLines(result.models)].join('\n')
        } catch (error) {
            return `Refresh failed: ${describe(error)}`
        }
    }

    registerHermesCommands(pi, {
        status: statusCommand,
        models: modelsCommand((options) => refresh(options)),
        test: testCommand((options) => refresh(options)),
        refresh: refreshCommand,
        setup: setupCommand,
        quota:
            'Quota information unavailable — the Hermes proxy exposes no quota endpoint.\n' +
            'Free-tier limits are enforced server-side; a 429 means the allowance is spent for now.'
    })

    pi.on('session_shutdown', () => {
        // The proxy is a separate shared process; leave it running for OMP and other sessions.
        runtime.models = []
    })

    if (runtime.error && runtime.error.includes('not logged in')) {
        pi.sendMessage(
            {
                customType: 'hermes-portal',
                display: true,
                content: `hermes-portal idle: ${runtime.error}\nRun /hermes setup.`
            },
            { triggerTurn: false }
        )
    }
}

export { HermesError }