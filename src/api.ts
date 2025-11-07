import { RepoData } from "./types";

export async function fetchRepos(owner: string): Promise<RepoData[]> {
    const cache = localStorage.getItem("repos");
    const ttl = 10 * 60 * 1000;
    if (cache) {
        if (Date.now() - JSON.parse(cache).timestamp > ttl) {
            localStorage.removeItem("repos");
        } else {
            return JSON.parse(cache).repos;
        }
    }

    const repos = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100`).then((r) => r.json()) as RepoData[];
    const map = repos.map((r) => ({
        name: r.name,
        html_url: r.html_url,
        description: r.description,
        fork: r.fork,
        archived: r.archived,
        language: r.language,
    }));

    localStorage.setItem("repos", JSON.stringify({ timestamp: Date.now(), repos: map }));
    return map;
}