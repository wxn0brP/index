import { clearCache } from "./api";
import { all } from "./data";
import { renderProjects, showDetails } from "./render";
import { Data, RepoData } from "./types";

declare const Fuse: any;

renderProjects(all);

const allRepos = all.flatMap(([, repos]) => repos);
const fuse = new Fuse(allRepos, {
    keys: ["name", "description"],
    includeScore: true,
    threshold: 0.4,
});

const searchInput = document.querySelector<HTMLInputElement>("input");
searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();

    if (query.length === 0) {
        renderProjects(all);
        return;
    }

    const results = fuse.search(query) as { item: RepoData }[];
    const filteredRepos = results.map(result => result.item);

    const filteredData = all
        .map(([category, repos]) => {
            const categoryRepos = repos.filter(repo => filteredRepos.includes(repo));
            return [category, categoryRepos];
        })
        .filter(([, repos]) => repos.length > 0) as any as Data[];

    renderProjects(filteredData);
});

document.querySelector<HTMLButtonElement>("#clear-cache").addEventListener("click", (e) => {
    const conf = e.ctrlKey || confirm("Are you sure you want to clear the cache?");
    if (!conf) return;
    clearCache();
});

const urlParam = new URLSearchParams(window.location.search);
const query = urlParam.get("q");
if (query) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event("input"));
}

const details = urlParam.get("d");
if (details) {
    const repo = allRepos.find(repo => repo.name === details);
    if (repo) showDetails(repo);
}