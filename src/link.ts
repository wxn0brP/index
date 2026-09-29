import { Config } from "./index/types";
import { parseLinkPage } from "./link-parser";

async function getConfig(): Promise<Config | null> {
	try {
		return (await fetch("res/config.json").then(r => r.json())) as Config;
	} catch (error) {
		console.error("Error loading config:", error);
		return null;
	}
}

function showError(message: string) {
	const errorContainer = document.getElementById("error-container");
	errorContainer.innerHTML = `<div class="error">${message}</div>`;
}

function escapeHtml(value: string) {
	const div = document.createElement("div");
	div.textContent = value;
	return div.innerHTML;
}

function titleCase(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function resolveProjectUrl(repo: string, path: string) {
	if (/^https?:\/\//.test(path)) return path;
	return `https://wxn0brp.github.io/${repo}${path.startsWith("/") ? path : `/${path}`}`;
}

function createLink(text: string, url: string, icon: string) {
	return `
        <a href="${url}" class="link-button" target="_blank" rel="noopener noreferrer">
            ${icon}
            <span>${escapeHtml(text)}</span>
        </a>
    `;
}

async function init() {
	const linksContainer = document.querySelector("#links-container");
	const config = await getConfig();
	const parsed = parseLinkPage(
		new URLSearchParams(
			window.location.hash.slice(1) || window.location.search,
		),
	);
	const { r, n } = parsed;

	// Check if at least one parameter is provided
	if (!r && !n) {
		showError("Error: provide at least one parameter: r, n, nr, x, or v.");
		return;
	}

	const links = [];

	if (r) {
		document.querySelector("#subtitle").innerHTML =
			`Repository: <span class="repo-name">${r}</span>`;

		const configuredLinks = config?.projects?.[r]?.links || {};
		Object.entries(configuredLinks).forEach(([name, path]) => {
			links.push(
				createLink(
					titleCase(name),
					resolveProjectUrl(r, path),
					`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656
                    5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>`,
				),
			);
		});
	}

	for (const link of parsed.links) {
		if (link.type === "pages" || link.type === "repo") {
			links.push(
				createLink(
					link.label,
					link.url,
					`<i class="devicon-github-original"></i>`,
				),
			);
		} else if (link.type === "npm") {
			links.push(
				createLink(
					link.label,
					link.url,
					`<i class="devicon-npm-original-wordmark"></i>`,
				),
			);
		} else if (link.type === "jsr") {
			links.push(
				createLink(
					link.label,
					link.url,
					`<svg style="color: white" width="64" height="64" viewBox="0 0 24 24"><path fill="currentColor" d="M3.692 5.538v3.693H0v7.384h7.385v1.847h12.923v-3.693H24V7.385h-7.385V5.538Zm1.846 1.847h1.847v7.384H1.846v-3.692h1.846v1.846h1.846zm3.693 0h5.538V9.23h-3.692v1.846h3.692v5.538H9.231V14.77h3.692v-1.846H9.231Zm7.384 1.846h5.539v3.692h-1.846v-1.846h-1.846v5.538h-1.847z"></path></svg>`,
				),
			);
		} else {
			links.push(
				createLink(
					link.label,
					link.url,
					`<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656
                    5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                </svg>`,
				),
			);
		}
	}

	linksContainer.innerHTML = links.join("");
}
init();

setTimeout(() => {
	document.body.style.backgroundColor = "";
	document.documentElement.style.backgroundColor = "";
}, 100);

function css() {
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.type = "text/css";
	link.href =
		"https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/devicon.min.css";
	document.head.appendChild(link);
}

css();
