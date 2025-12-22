import { getRepoData } from "./api";
import { Data } from "./types";

const main = document.querySelector<HTMLDivElement>("main")!;

const langMap: Record<string, string> = {
    "C++": "cplusplus",
    "C#": "csharp",
    "CSS": "css3",
    "HTML": "html5",
    "Shell": "bash",
};

const link = (name: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;
const npmHtml = `
<a href="$url" target="_blank" title="NPM">
    <img class="service-icon" src="${link("npm")}" alt="NPM">
</a>`;
const ghPagesHtml = `
<a href="$url" target="_blank" title="GitHub Pages">
    <img class="service-icon" src="${link("github")}" style="filter: invert(1)" alt="GitHub Pages">
</a>`;

export function renderProjects(data: Data[]) {
    let html = ``;
    for (const obj of data) {
        const [category, repos] = obj as Data;
        if (repos.length > 0) {
            html += `<h2>${category}</h2>`;
            html += `<ul>`;
            for (const repo of repos) {
                const lang = repo.language ? langMap[repo.language] || repo.language.toLowerCase() : "";
                const icon = `<img class="lang-icon" src="${link(lang || "markdown")}">`;

                const repoData = getRepoData(repo);
                let linksHtml = ``;

                if (repoData && repoData.npm) {
                    let n = repo.name;
                    if (n && n.startsWith("ValtheraDB")) n = n.replace("ValtheraDB", "db");
                    if (n.match(/[A-Z]/))
                        n = n[0] + n.slice(1).replace(/([A-Z])/g, "-$1");

                    n = "@wxn0brp/" + n.toLowerCase();
                    const npmUrl = `https://www.npmjs.com/package/${n}`;
                    linksHtml += npmHtml.replace("$url", npmUrl);
                }

                if (repoData && repoData.gh) {
                    const ghPagesUrl = `https://wxn0brP.github.io/${repo.name}`;
                    linksHtml += ghPagesHtml.replace("$url", ghPagesUrl);
                }

                html += `<li>
                    <div class="project-info">
                        <div class="lang-icon">${icon}</div>
                        <div class="project-details">
                            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                            <div class="project-description">${repo.description || ``}</div>
                        </div>
                    </div>
                    <div class="project-links">${linksHtml}</div>
                </li>`;
            }
            html += `</ul>`;
        }
    }
    main.innerHTML = html;
}