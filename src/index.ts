import { all } from "./data";
import { renderProjects } from "./render";
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