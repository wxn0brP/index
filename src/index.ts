import { fetchRepos } from "./api";
import { categorizeOthers, groupReposByPrefix } from "./category";
import { Config, RepoData } from "./types";

const config = await fetch("config.json").then(r => r.json()) as Config;
const repos = await fetchRepos("wxn0brP");
const allCategories = groupReposByPrefix(repos);
const categories = categorizeOthers(allCategories.get("others")!, config.prefixRules);
console.log(categories);

allCategories.delete("others");

const allMap = new Map<string, RepoData[]>();
for (const [category, repos] of categories.categorized) {
    allMap.set(category, repos);
}
for (const [category, repos] of allCategories) {
    allMap.set(category, repos);
}
allMap.set("Uncategorized", categories.uncategorized);

for (const alias of Object.entries(config.alias)) {
    allMap.set(alias[1], allMap.get(alias[0])!);
    allMap.delete(alias[0]);
}

if (config.move) {
    for (const [projectName, newCategory] of Object.entries(config.move)) {
        let repoToMove: RepoData | undefined;
        let oldCategory: string | undefined;

        for (const [category, repos] of allMap.entries()) {
            const repoIndex = repos.findIndex(repo => repo.name === projectName);
            if (repoIndex !== -1) {
                repoToMove = repos[repoIndex];
                oldCategory = category;
                repos.splice(repoIndex, 1);
                if (repos.length === 0) {
                    allMap.delete(category);
                }
                break;
            }
        }

        if (repoToMove) {
            if (!allMap.has(newCategory))
                allMap.set(newCategory, []);
            allMap.get(newCategory)!.push(repoToMove);
        }
    }
}

const all = [];
for (const category of config.order) {
    if (allMap.has(category)) {
        all.push([category, allMap.get(category)!]);
        allMap.delete(category);
    }
}
all.push(...allMap.entries());

let html = ``;
for (const obj of all) {
    const [category, repos] = obj as [string, RepoData[]];
    html += `<h2>${category}</h2>`;
    html += `<ul>`;
    for (const repo of repos) {
        html += `<li><a href="${repo.html_url}">${repo.name}</a> - ${repo.description}</li>`;
    }
    html += `</ul>`;
}

document.querySelector("main")!.innerHTML = html;

export { }