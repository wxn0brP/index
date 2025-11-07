import { all } from "./data";
import { renderProjects } from "./render";
import { RepoData } from "./types";

renderProjects(all);

const searchInput = document.querySelector<HTMLInputElement>("input");
searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filteredData = all
        .map(([category, repos]) => {
            const filteredRepos = repos.filter(repo => {
                const nameMatch = repo.name.toLowerCase().includes(query);
                const descriptionMatch = repo.description ? repo.description.toLowerCase().includes(query) : false;
                return nameMatch || descriptionMatch;
            });

            return [category, filteredRepos];
        })
        .filter(([category, repos]) => repos.length > 0) as any as [string, RepoData[]][];

    renderProjects(filteredData);
});