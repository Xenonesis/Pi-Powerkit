/**
 * Free Web Search (DuckDuckGo HTML)
 *
 * Registers a `web_search` tool that scrapes DuckDuckGo's HTML endpoint.
 * - No API key required
 * - No approval prompts (registered as a user extension from ~/.pi/agent/extensions/)
 * - Returns titles, URLs, and snippets
 *
 * Backed by:
 *   https://html.duckduckgo.com/html/?q=<query>
 *
 * For more capable search (Perplexity/Exa/Gemini) use the upstream
 * `web_search` tool from `pi-web-access` once an API key is configured.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

interface SearchHit {
	title: string;
	url: string;
	snippet: string;
}

const UA =
	"Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0";

const MAX_RESULTS = 8;
const REQUEST_TIMEOUT_MS = 12_000;

function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ");
}

function stripTags(s: string): string {
	return s.replace(/<[^>]+>/g, "").trim();
}

function extractHits(html: string): SearchHit[] {
	const hits: SearchHit[] = [];
	const re =
		/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html)) !== null) {
		let href = m[1];
		const title = decodeHtmlEntities(stripTags(m[2]));
		const snippet = decodeHtmlEntities(stripTags(m[3]));
		const uddgMatch = href.match(/uddg=([^&]+)/);
		if (uddgMatch) {
			try {
				href = decodeURIComponent(uddgMatch[1]);
			} catch {
				/* keep original */
			}
		} else if (href.startsWith("//")) {
			href = "https:" + href;
		}
		if (title && href.startsWith("http")) {
			hits.push({ title, url: href, snippet });
		}
	}
	return hits;
}

async function ddgSearch(
	query: string,
	numResults: number,
): Promise<SearchHit[]> {
	const limit = Math.min(Math.max(numResults | 0, 1), MAX_RESULTS);
	const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
	const { stdout } = await execFileP(
		"curl",
		[
			"-sS",
			"-L",
			"--max-time",
			String(Math.floor(REQUEST_TIMEOUT_MS / 1000)),
			"-A",
			UA,
			"-H",
			"Accept: text/html,application/xhtml+xml",
			url,
		],
		{ maxBuffer: 4 * 1024 * 1024 },
	);
	return extractHits(stdout).slice(0, limit);
}

function formatAnswer(query: string, hits: SearchHit[]): string {
	if (hits.length === 0) return `## Web search: ${query}\n\nNo results.`;
	const lines: string[] = [`## Web search: ${query}`, ""];
	for (const [i, h] of hits.entries()) {
		lines.push(`### ${i + 1}. [${h.title}](${h.url})`);
		if (h.snippet) lines.push(h.snippet);
		lines.push("");
	}
	lines.push(`---`);
	lines.push(
		`Source: DuckDuckGo HTML (free, no API key). ${hits.length} result(s).`,
	);
	return lines.join("\n");
}

type SearchParams = {
	query?: string;
	queries?: string[];
	numResults?: number;
};

function validateParams(input: unknown): {
	queries: string[];
	numResults: number;
} {
	const p = (input ?? {}) as SearchParams;
	const q: string[] = [];
	if (typeof p.query === "string" && p.query.trim()) q.push(p.query.trim());
	if (Array.isArray(p.queries)) {
		for (const x of p.queries) {
			if (typeof x === "string" && x.trim()) q.push(x.trim());
		}
	}
	const numResults = typeof p.numResults === "number" ? p.numResults : 5;
	return { queries: q, numResults };
}

export default function (pi: {
	registerTool(tool: {
		name: string;
		label: string;
		description: string;
		promptSnippet?: string;
		parameters: unknown;
		execute(
			toolCallId: string,
			params: unknown,
			signal: AbortSignal | undefined,
			onUpdate: ((details: unknown) => void) | undefined,
			ctx: unknown,
		): Promise<{ content: { type: "text"; text: string }[]; details: unknown }>;
	}): void;
}) {
	pi.registerTool({
		name: "ddg_search",
		label: "Free Web Search (DDG)",
		description:
			"Free web search using DuckDuckGo's HTML endpoint. No API key, no approval prompt. Returns titles, URLs, and snippets. Prefer queries (plural) with 2-4 varied angles for broader coverage on research topics. For deeper synthesis with citations, use the upstream web_search tool from pi-web-access if a paid provider key is configured.",
		promptSnippet:
			"Use for quick web lookups when no paid search API is configured. Returns titles + URLs + snippets (no synthesized answer).",
		parameters: {
			type: "object",
			properties: {
				query: { type: "string", description: "Single search query." },
				queries: {
					type: "array",
					items: { type: "string" },
					description:
						"Multiple search queries (preferred for research, 2-4 varied angles).",
				},
				numResults: {
					type: "number",
					minimum: 1,
					maximum: 8,
					description: "Results per query (default 5, max 8).",
				},
			},
		},
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { queries, numResults } = validateParams(params);
			if (queries.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "Error: provide `query` (string) or `queries` (string[]).",
						},
					],
					details: { error: "no_query" },
				};
			}
			const allResults: { query: string; hits: SearchHit[] }[] = [];
			for (const q of queries) {
				try {
					const hits = await ddgSearch(q, numResults);
					allResults.push({ query: q, hits });
				} catch (e) {
					allResults.push({
						query: q,
						hits: [
							{
								title: "Search failed",
								url: "about:blank",
								snippet: e instanceof Error ? e.message : String(e),
							},
						],
					});
				}
			}
			const sections = allResults.map(({ query, hits }) =>
				formatAnswer(query, hits),
			);
			return {
				content: [{ type: "text", text: sections.join("\n\n") }],
				details: { queries, results: allResults },
			};
		},
	});
}
