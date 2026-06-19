import { fetchRepos } from "./api";
import { categorizeOthers, groupReposByPrefix } from "./category";
import { Config, Data, RepoData } from "./types";

const config = await fetch("res/config.json").then(r => r.json()) as Config;
const repos = await fetchRepos("wxn0brP");
const allCategories = groupReposByPrefix(repos);
const categories = categorizeOthers(allCategories.get("others")!, config.prefixRules);

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
    for (const [projectName, newCategoryData] of Object.entries(config.move)) {
        let repoToMove: RepoData | undefined;
        const [newCategory, orderString] = newCategoryData.split(".");

        for (const [category, repos] of allMap.entries()) {
            const repoIndex = repos.findIndex(repo => repo.name === projectName);
            if (repoIndex !== -1) {
                repoToMove = repos[repoIndex];
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
            const category = allMap.get(newCategory)!;
            let order = +orderString;
            if (order < 0) order += category.length + 1;
            category.splice(order, 0, repoToMove);
        }
    }
}

export const all: Data[] = [];
for (const category of config.order) {
    if (allMap.has(category)) {
        all.push([category, allMap.get(category)!]);
        allMap.delete(category);
    }
}
all.push(...allMap.entries());

export const pinned = (config.pinned || [])
    .map(name => repos.find(repo => repo.name === name))
    .filter(Boolean) as RepoData[];
