import { RepoData } from "../index/types";

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

    const repos = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100`).then((r) => r.json()) as RepoData[];
    const map = repos.map((r) => ({
        name: r.name,
        html_url: r.html_url,
        description: r.description,
        fork: r.fork,
        archived: r.archived,
        language: r.language,
        homepage: r.homepage
    }));

    setCache("repos", map);
    return map;
}

const isDirectGhPages = (url: string) => url.startsWith("https://wxn0brp.github.io/");
const isEngineFormat = (url: string) => /^https:\/\/wxn0brp\.github\.io\/l(\?|$)/.test(url);
const isNpmLink = (url: string) => url.startsWith("https://www.npmjs.com/");

export function getRepoData(repo: RepoData) {
    const { homepage } = repo;
    if (!homepage) return null;

    if (isEngineFormat(homepage)) {
        const url = new URL(homepage);
        const params = url.searchParams;
        const r = params.get("r") || params.get("nr") || params.get("x");
        const n = params.get("n") || params.get("nr") || params.get("x");

        return {
            gh: !!r,
            npm: !!n
        }
    } else if (isDirectGhPages(homepage)) {
        return {
            gh: true,
            npm: false
        }
    } else if (isNpmLink(homepage)) {
        return {
            gh: false,
            npm: true
        }
    }

    return null;
}