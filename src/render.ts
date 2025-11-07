import { RepoData } from "./types";

const main = document.querySelector("main")!;

const langMap: Record<string, string> = {
    "C++": "cplusplus",
    "C#": "csharp",
    "CSS": "css3",
    "HTML": "html5",
    "Shell": "bash",
};

const link = (name: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;

export function renderProjects(data: [string, RepoData[]][]) {
    let html = ``;
    for (const obj of data) {
        const [category, repos] = obj as [string, RepoData[]];
        if (repos.length > 0) {
            html += `<h2>${category}</h2>`;
            html += `<ul>`;
            for (const repo of repos) {
                const lang = repo.language ? langMap[repo.language] || repo.language.toLowerCase() : "";
                const icon = `<img class="lang-icon" src="${link(lang || "markdown")}">`;
                html += `<li>
                    ${icon}
                    <a href="${repo.html_url}">${repo.name}</a> -
                    ${repo.description}
                </li>`;
            }
            html += `</ul>`;
        }
    }
    main.innerHTML = html;
}