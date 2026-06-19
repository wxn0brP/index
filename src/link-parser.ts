import { normalizeNpmPackageName } from "./index/npm";

const specialMap: Record<string, string> = {
    "": "ValtheraDB",
    core: "ValtheraDB-core",
};

export type ParsedLinkType = "pages" | "npm" | "repo" | "custom";

export interface ParsedLink {
    type: ParsedLinkType;
    label: string;
    url: string;
}

export interface ParsedLinkPage {
    r: string | null;
    n: string | null;
    links: ParsedLink[];
}

function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function resolveProjectUrl(repo: string, path: string) {
    if (/^https?:\/\//.test(path)) return path;
    return `https://wxn0brp.github.io/${repo}${path.startsWith("/") ? path : `/${path}`}`;
}

function parseCustomLinks(linksJson: string | null): Record<string, string> | null {
    if (!linksJson) return null;
    try {
        let parsed = {};
        if (!linksJson.includes("{") && !linksJson.includes("[")) {
            const split = linksJson.split(",");
            if (linksJson.includes(":"))
                parsed = Object.fromEntries(split.map(item => item.split(":")));
            else
                parsed = split;
        } else {
            parsed = JSON.parse(linksJson);
        }

        if (Array.isArray(parsed)) {
            const result: Record<string, string> = {};
            parsed.forEach(name => {
                result[name] = `/${name}`;
            });
            return result;
        }

        if (typeof parsed === "object" && parsed !== null) {
            const result: Record<string, string> = {};
            Object.entries(parsed).forEach(([key, value]) => {
                if (typeof value === "string") result[key] = value.startsWith("/") ? value : `/${value}`;
                else result[key] = `/${key}`;
            });
            return result;
        }

        return null;
    } catch (e) {
        console.error("Error parsing custom links:", e);
        return null;
    }
}

function paramsFromUrl(urlOrParams: string | URLSearchParams) {
    if (urlOrParams instanceof URLSearchParams) return urlOrParams;

    const source = urlOrParams.trim();
    if (/^https?:\/\//.test(source)) {
        const url = new URL(source);
        return new URLSearchParams(url.hash.slice(1) || url.search);
    }

    return new URLSearchParams(source.replace(/^[?#]/, ""));
}

export function isLinkPageUrl(url: string) {
    return /^https:\/\/wxn0brp\.github\.io\/l(\?|#|$)/i.test(url)
        || /^https:\/\/wxn0brp\.github\.io\/(\?|#)/i.test(url);
}

export function parseLinkPage(urlOrParams: string | URLSearchParams, includeRepo = true): ParsedLinkPage {
    const params = paramsFromUrl(urlOrParams);
    let d = params.has("d");
    let nr = params.get("nr") || params.get("n") || null;

    if (params.has("x")) {
        nr = params.get("x");
        d = true;
    }

    if (params.has("v")) {
        const v = params.get("v") || "";
        nr = specialMap[v] || "ValtheraDB-storage-" + v;
        d = true;
    }

    const r = params.get("r") || nr;
    const n = nr;
    const links: ParsedLink[] = [];

    if (r && !params.has("ng")) {
        links.push({
            type: "pages",
            label: d ? "Docs" : "GitHub Pages",
            url: `https://wxn0brp.github.io/${r}/`,
        });
    }

    let customLinks = parseCustomLinks(params.get("l"));
    if (params.has("ld")) {
        customLinks = customLinks || {};
        customLinks.demo = "/demo";
    }

    if (r && customLinks) {
        for (const [label, path] of Object.entries(customLinks)) {
            links.push({
                type: "custom",
                label: titleCase(label),
                url: resolveProjectUrl(r, path),
            });
        }
    }

    if (n) {
        links.push({
            type: "npm",
            label: "NPM Package",
            url: `https://www.npmjs.com/package/${normalizeNpmPackageName(n)}`,
        });
    }

    if (includeRepo) {
        const repoName = r || n;
        if (repoName) {
            links.push({
                type: "repo",
                label: "GitHub Repository",
                url: `https://github.com/wxn0brP/${repoName}`,
            });
        }
    }

    return { r, n, links };
}
