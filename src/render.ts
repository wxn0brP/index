import { RepoData } from "./types";

const main = document.querySelector("main")!;

export function renderProjects(data: [string, RepoData[]][]) {
    let html = ``;
    for (const obj of data) {
        const [category, repos] = obj as [string, RepoData[]];
        if (repos.length > 0) {
            html += `<h2>${category}</h2>`;
            html += `<ul>`;
            for (const repo of repos) {
                html += `<li><a href="${repo.html_url}">${repo.name}</a> - ${repo.description}</li>`;
            }
            html += `</ul>`;
        }
    }
    main.innerHTML = html;
}