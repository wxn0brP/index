import { getRepoData } from "./api";
import { normalizeNpmPackageName } from "./npm";
import { getProjectStatus } from "./status";
import { getProjectTags } from "./tags";
import { Data, RepoData } from "./types";

const projectsRoot = document.querySelector<HTMLDivElement>("#projects")!;
const emptyState = document.querySelector<HTMLParagraphElement>("#empty-state")!;

const langMap: Record<string, string> = {
    "C++": "cplusplus",
    "C#": "csharp",
    "CSS": "css3",
    "HTML": "html5",
    "Shell": "bash",
};

const link = (name: string) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;
const npmHtml = `
<a href="$url" target="_blank" rel="noopener noreferrer" title="NPM" aria-label="NPM package">
    <img class="service-icon" src="${link("npm")}" alt="NPM">
</a>`;
const globeIcon = `
<svg class="service-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M3 12h18"></path>
    <path d="M12 3a14 14 0 0 1 0 18"></path>
    <path d="M12 3a14 14 0 0 0 0 18"></path>
</svg>`;
const ghPagesHtml = `
<a href="$url" target="_blank" rel="noopener noreferrer" title="GitHub Pages" aria-label="GitHub Pages">
    ${globeIcon}
</a>`;

function escapeHtml(value: string) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

function repoCreatedLabel(repo: RepoData) {
    if (!repo.created_at) return "";
    const createdAt = new Date(repo.created_at);
    if (Number.isNaN(createdAt.getTime())) return "";

    return `Created: ${createdAt.toISOString().replace("T", " ").replace(".000Z", " UTC")}`;
}

function externalAttrs(url: string) {
    return url.startsWith("http") ? ` target="_blank" rel="noopener noreferrer"` : "";
}

function resolveProjectUrl(repo: RepoData, url: string) {
    if (/^https?:\/\//.test(url)) return url;
    return `https://wxn0brp.github.io/${repo.name}${url.startsWith("/") ? url : `/${url}`}`;
}

function projectLinks(repo: RepoData) {
    const repoData = getRepoData(repo);
    let linksHtml = `
        <div class="project-actions">
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" title="Repository" aria-label="GitHub repository">
            <img class="service-icon" src="${link("github")}" style="filter: invert(1)" alt="GitHub">
        </a>`;

    if (repoData?.links?.length) {
        for (const item of repoData.links) {
            if (item.type === "npm") {
                linksHtml += npmHtml.replace("$url", item.url);
            } else if (item.type === "pages") {
                linksHtml += ghPagesHtml.replace("$url", item.url);
            } else {
                linksHtml += `
                    <a class="text-link" href="${escapeHtml(item.url)}"${externalAttrs(item.url)}>${escapeHtml(item.label)}</a>`;
            }
        }
    } else if (repoData && repoData.npm) {
        const npmUrl = `https://www.npmjs.com/package/${normalizeNpmPackageName(repo.name)}`;
        linksHtml += npmHtml.replace("$url", npmUrl);
    } else if (repoData && repoData.gh) {
        const ghPagesUrl = `https://wxn0brP.github.io/${repo.name}`;
        linksHtml += ghPagesHtml.replace("$url", ghPagesUrl);
    }

    // Manual links are additive; generated links above still come from homepage parsing first.
    for (const [label, url] of Object.entries(repo.meta?.links || {})) {
        const resolvedUrl = resolveProjectUrl(repo, url);
        linksHtml += `
            <a class="text-link" href="${escapeHtml(resolvedUrl)}"${externalAttrs(resolvedUrl)}>${escapeHtml(label)}</a>`;
    }

    return `${linksHtml}</div>`;
}

function renderProjectCard(repo: RepoData) {
    const lang = repo.language ? langMap[repo.language] || repo.language.toLowerCase() : "";
    const icon = `<img class="lang-icon" src="${link(lang || "markdown")}" alt="">`;
    const description = repo.meta?.summary || repo.description || "No description provided.";
    const tags = getProjectTags(repo);
    const status = getProjectStatus(repo);
    const titleAttrs = repoCreatedLabel(repo) ? ` title="${repoCreatedLabel(repo)}"` : "";

    return `<article class="project-item">
        <div class="project-info">
            <div class="project-heading">
                ${icon}
                <div class="project-details">
                    <a class="project-title" href="${repo.html_url}" target="_blank" rel="noopener noreferrer"${titleAttrs}>${escapeHtml(repo.name)}</a>
                    <p class="project-description">${escapeHtml(description)}</p>
                </div>
            </div>
            <div class="project-meta">
                ${repo.language ? `<button class="meta-btn" type="button" data-filter="lang" data-value="${escapeHtml(repo.language)}">${escapeHtml(repo.language)}</button>` : ""}
                <button class="meta-btn status" type="button" data-filter="status" data-value="${status}">${status}</button>
                ${tags.map(tag => `<button class="meta-btn" type="button" data-filter="tag" data-value="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
            </div>
        </div>
        ${projectLinks(repo)}
    </article>`;
}

export function renderProjects(data: Data[], pinned: RepoData[] = []) {
    const repos = data.flatMap(([, repos]) => repos);

    let html = ``;
    for (const obj of data) {
        const [category, repos] = obj as Data;
        if (repos.length > 0) {
            html += `<section class="project-section">
                <div class="list-header">
                    <h2>${escapeHtml(category)}</h2>
                    <span>${repos.length} projects</span>
                </div>
                <div class="project-list">`;
            for (const repo of repos) {
                html += renderProjectCard(repo);
            }
            html += `</div></section>`;
        }
    }
    projectsRoot.innerHTML = html;
    emptyState.hidden = repos.length > 0;
}
