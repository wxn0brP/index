#!/usr/bin/env bun

import { writeFile } from "fs/promises";

interface Repo {
	name: string;
	html_url: string;
	homepage: string | null;
}

// Parses "l" parameter the same way your engine does
function parseCustomLinksValue(value: string | null): Record<string, string> | null {
	if (!value) return null;

	try {
		let parsed: any;

		// Handle "demo, docs"
		if (!value.includes("{") && !value.includes("[")) {
			const arr = value.split(",").map(v => v.trim()).filter(Boolean);
			const out: Record<string, string> = {};
			for (const name of arr) {
				out[name] = `/${name}`;
			}
			return out;
		}

		parsed = JSON.parse(value);

		// Handle array format
		if (Array.isArray(parsed)) {
			const out: Record<string, string> = {};
			for (const name of parsed) {
				out[name] = `/${name}`;
			}
			return out;
		}

		// Handle object format
		if (typeof parsed === "object" && parsed !== null) {
			const out: Record<string, string> = {};
			for (const [name, raw] of Object.entries(parsed)) {
				if (raw === true || raw === 1) {
					out[name] = `/${name}`;
				} else if (typeof raw === "string" && raw.startsWith("/")) {
					out[name] = raw;
				}
			}
			return out;
		}

		return null;
	} catch {
		return null;
	}
}

// Converts the new format https://wxn0brp.github.io/l?... into real pages
function extractEngineLinks(homepage: string): string[] {
	const url = new URL(homepage);
	const params = url.searchParams;

	const r = params.get("r") || params.get("nr");
	const n = params.get("n") || params.get("nr");
	const l = params.get("l");

	const result: string[] = [];

	// If "r" exists - repo-based GH pages
	if (r) {
		result.push(`https://wxn0brp.github.io/${r}/`);

		if (params.has("ld"))
			result.push(`https://wxn0brp.github.io/${r}/demo`);

		const custom = parseCustomLinksValue(l);
		if (custom) {
			for (const path of Object.values(custom)) {
				result.push(`https://wxn0brp.github.io/${r}${path}`);
			}
		}
	}

	// If only "n" exists, fallback link (npm no longer used)
	if (!r && n) {
		const repoName = n.startsWith("ValtheraDB") ? n.replace("ValtheraDB", "db") : n;
		result.push(`https://github.com/wxn0brP/${repoName}`);
	}

	return result;
}

const isDirectGhPages = (url: string) => url.startsWith("https://wxn0brp.github.io/");
const isEngineFormat = (url: string) => /^https:\/\/wxn0brp\.github\.io\/l(\?|$)/.test(url);
const isNpmLink = (url: string) => url.startsWith("https://www.npmjs.com/");
const isCustomExternal = (url: string) => !isDirectGhPages(url) && !isEngineFormat(url) && !isNpmLink(url);

async function main() {
	const reposRaw = await fetch(
		"https://api.github.com/users/wxn0brP/repos?per_page=100"
	).then(r => r.json());

	const repos: Repo[] = reposRaw.map((repo: any) => ({
		name: repo.name,
		html_url: repo.html_url,
		homepage: repo.homepage
	}));

	const sitemapUrls: string[] = [];

	for (const repo of repos) {
		const homepage = repo.homepage?.trim() || "";

		if (!homepage) {
			// No homepage - include GitHub repo URL
			sitemapUrls.push(repo.html_url);
			continue;
		}

		// 1. Engine link format
		if (isEngineFormat(homepage)) {
			const links = extractEngineLinks(homepage);
			if (links.length > 0) sitemapUrls.push(...links);
			sitemapUrls.push(repo.html_url);
			continue;
		}

		// 2. Direct GH pages link
		if (isDirectGhPages(homepage)) {
			sitemapUrls.push(homepage);
			sitemapUrls.push(repo.html_url);
			continue;
		}

		// 3. Custom external site
		if (isCustomExternal(homepage)) {
			sitemapUrls.push(homepage);
			sitemapUrls.push(repo.html_url);
			continue;
		}

		// 4. Old npm homepage format - ignore, fallback to repo URL
		if (isNpmLink(homepage)) {
			sitemapUrls.push(repo.html_url);
			continue;
		}
	}

	// Generate XML
	const xml = generateSitemap(sitemapUrls);
	await writeFile("./sitemap.xml", xml, "utf8");

	console.log("Sitemap generated: sitemap.xml");
}

function generateSitemap(urls: string[]): string {
	const unique = Array.from(new Set(urls));

	const items = unique
		.map(
			url => `
	<url>
		<loc>${url}</loc>
		<priority>0.8</priority>
		<changefreq>weekly</changefreq>
	</url>`
		)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

main();
