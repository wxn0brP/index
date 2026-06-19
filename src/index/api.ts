import { fetchRepoPages } from "#api.utils";
import { RepoData } from "../index/types";
import { isLinkPageUrl, parseLinkPage } from "../link-parser";

const chachKey = "wxn/project-catalog/cache";
const ttl = 10 * 60 * 1000;
function getCache(key: string) {
    key = `${chachKey}/${key}`;
    const cache = localStorage.getItem(key);
    if (cache) {
        if (Date.now() - JSON.parse(cache).time > ttl) {
            localStorage.removeItem(key);
        } else {
            return JSON.parse(cache).data;
        }
    }
    return null;
}

function setCache(key: string, data: any) {
    key = `${chachKey}/${key}`;
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
}

export function clearCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(chachKey));
    for (const key of keys)
        localStorage.removeItem(key);
}

export async function fetchRepos(owner: string): Promise<RepoData[]> {
    const cached = getCache("repos");
    if (cached) return cached;

    const repos: RepoData[] = await fetchRepoPages(owner);

    const map = repos.map((r) => ({
        name: r.name,
        html_url: r.html_url,
        description: r.description,
        fork: r.fork,
        archived: r.archived,
        language: r.language,
        homepage: r.homepage,
        created_at: r.created_at,
        topics: r.topics || []
    }));

    setCache("repos", map);
    return map;
}

const isDirectGhPages = (url: string) => url.startsWith("https://wxn0brp.github.io/");
const isNpmLink = (url: string) => url.startsWith("https://www.npmjs.com/");

export function getRepoData(repo: RepoData) {
    const { homepage } = repo;
    if (!homepage) return null;

    if (isLinkPageUrl(homepage)) {
        const parsed = parseLinkPage(homepage, false);

        return {
            gh: parsed.links.some(link => link.type === "pages"),
            npm: parsed.links.some(link => link.type === "npm"),
            links: parsed.links,
        }
    } else if (isDirectGhPages(homepage)) {
        return {
            gh: true,
            npm: false,
            links: [{
                type: "pages" as const,
                label: "GitHub Pages",
                url: homepage,
            }],
        }
    } else if (isNpmLink(homepage)) {
        return {
            gh: false,
            npm: true,
            links: [{
                type: "npm" as const,
                label: "NPM",
                url: homepage,
            }],
        }
    }

    return null;
}
