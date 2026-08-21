#!/usr/bin/env bun

import { fetchRepoPages } from "#api.utils";
import { writeFile } from "fs/promises";

interface Repo {
	name: string;
	html_url: string;
	homepage: string | null;
}

// Parses "l" parameter
function parseCustomLinksValue(
	value: string | null,
): Record<string, string> | null {
	if (!value) return null;

	try {
		let parsed: any;

		if (!value.includes("{") && !value.includes("[")) {
			const arr = value
				.split(",")
				.map(v => v.trim())
				.filter(Boolean);
			const out: Record<string, string> = {};
			for (const name of arr) {
				out[name] = `/${name}`;
			}
			return out;
		}

		parsed = JSON.parse(value);

		if (Array.isArray(parsed)) {
			const out: Record<string, string> = {};
			for (const name of parsed) {
				out[name] = `/${name}`;
			}
			return out;
		}

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

// Extract GH Pages links from engine format
function extractEngineLinks(homepage: string): string[] {
	const url = new URL(homepage);
	const params = url.searchParams;

	const r = params.get("r") || params.get("nr");
	const l = params.get("l");

	const result: string[] = [];

	if (r) {
		result.push(`https://wxn0brp.github.io/${r}/`);

		if (params.has("ld")) result.push(`https://wxn0brp.github.io/${r}/demo`);

		const custom = parseCustomLinksValue(l);
		if (custom) {
			for (const path of Object.values(custom)) {
				result.push(`https://wxn0brp.github.io/${r}${path}`);
			}
		}
	}

	return result;
}

// Check if link is GH Pages
const isGHPages = (url: string) => url.startsWith("https://wxn0brp.github.io/");

// Generate XML
function generateSitemap(urls: string[]): string {
	const unique = Array.from(new Set(urls));

	const items = unique
		.map(
			url => `
	<url>
		<loc>${url}</loc>
		<priority>0.8</priority>
		<changefreq>weekly</changefreq>
	</url>`,
		)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

// Convert GH Pages link to wxn0.xyz link
function convertToWxn0(url: string): string {
	return url.replace("https://wxn0brp.github.io/", "https://wxn0.xyz/");
}

// Main
async function main() {
	const reposRaw = await fetchRepoPages("wxn0brP");

	const repos: Repo[] = reposRaw.map((repo: any) => ({
		name: repo.name,
		html_url: repo.html_url,
		homepage: repo.homepage,
	}));

	const sitemapUrls: string[] = [];

	for (const repo of repos) {
		const homepage = repo.homepage?.trim() || "";

		if (!homepage) continue;

		if (homepage.startsWith("https://wxn0brp.github.io/l")) {
			const links = extractEngineLinks(homepage);
			sitemapUrls.push(...links.filter(isGHPages));
			continue;
		}

		if (isGHPages(homepage)) {
			sitemapUrls.push(homepage);
			continue;
		}
	}

	// Generate main GH Pages sitemap
	const xml = generateSitemap(sitemapUrls);
	await writeFile("./sitemap.xml", xml, "utf8");
	console.log("Sitemap generated: sitemap.xml");

	// Generate wxn0.xyz sitemap (post-production)
	const wxn0Urls = sitemapUrls.map(convertToWxn0);
	const wxn0Xml = generateSitemap(wxn0Urls);
	await writeFile("./sitemap-wxn0.xml", wxn0Xml, "utf8");
	console.log("Post-production sitemap generated: sitemap-wxn0.xml");
}

main();
