import { Data, RepoData } from "./types";
import { checkGitHubPages, checkNpmPackage } from "./api";

const main = document.querySelector<HTMLDivElement>("main")!;
const popup = document.querySelector<HTMLDivElement>("#popup")!;
const popupTitle = document.querySelector<HTMLHeadingElement>("#popup-title")!;
const ghPagesStatus = document.querySelector<HTMLDivElement>("#gh-pages-status")!;
const npmStatus = document.querySelector<HTMLDivElement>("#npm-status")!;
const closeBtn = document.querySelector<HTMLButtonElement>(".close-btn")!;

closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
});

popup.addEventListener("click", (e) => {
    if (e.target === popup) {
        popup.style.display = "none";
    }
});

const langMap: Record<string, string> = {
    "C++": "cplusplus",
    "C#": "csharp",
    "CSS": "css3",
    "HTML": "html5",
    "Shell": "bash",
};

const link = (name: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;

export async function showDetails(repo: RepoData) {
    popupTitle.textContent = `${repo.name} Details`;

    ghPagesStatus.innerHTML = `<span class="info-value">Loading...</span>`;
    npmStatus.innerHTML = `<span class="info-value">Loading...</span>`;

    popup.style.display = "flex";
    try {
        checkGitHubPages("wxn0brP", repo.name).then(ghPages => {
            ghPagesStatus.innerHTML = ghPages?.enabled ?
                `<span class="status-badge status-yes">Yes</span> - <a href="${ghPages.url}" target="_blank">${ghPages.url}</a>` :
                `<span class="status-badge status-no">No</span>`;
        });

        checkNpmPackage("wxn0brP", repo.name).then(npm => {
            npmStatus.innerHTML = npm?.exists && npm?.published ?
                `<span class="status-badge status-yes">Yes</span> - ${npm.name}@${npm.version}` :
                `<span class="status-badge status-no">No</span>`;
        });
    } catch (error) {
        console.error(`Error loading details for ${repo.name}:`, error);
        ghPagesStatus.innerHTML = `<span class="status-badge status-no">Error loading data</span>`;
        npmStatus.innerHTML = `<span class="status-badge status-no">Error loading data</span>`;
    }
}

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
                html += `<li>
                    <div class="project-info">
                        <div class="lang-icon">${icon}</div>
                        <div class="project-details">
                            <a href="${repo.html_url}">${repo.name}</a>
                            <div class="project-description">${repo.description || ``}</div>
                        </div>
                    </div>
                    <button class="details-btn" data-repo="${repo.name}">Details</button>
                </li>`;
            }
            html += `</ul>`;
        }
    }
    main.innerHTML = html;

    document.querySelectorAll(".details-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const repoName = btn.getAttribute("data-repo");
            const repos = data.flatMap(([_, repos]) => repos);
            const repo = repos.find(r => r.name === repoName);

            if (repo) showDetails(repo);
        });
    });
}