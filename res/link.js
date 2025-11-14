
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    let r = params.get("r") || params.get("nr");
    let n = params.get("n") || params.get("nr");
    const l = params.get("l");

    return { r, n, l };
}

function parseCustomLinks(linksJson) {
    if (!linksJson) return null;
    try {
        let parsed = {};
        // Handle string format: "demo, docs"
        if (!linksJson.includes("{") && !linksJson.includes("[")) {
            parsed = linksJson.split(",");
        } else {
            parsed = JSON.parse(linksJson);
        }

        // Handle array format: ["demo", "docs"]
        if (Array.isArray(parsed)) {
            const result = {};
            parsed.forEach(name => {
                result[name] = `/${name}`;
            });
            return result;
        }

        // Handle object format: {"demo": "/custom/path"} or {"demo": 1}
        if (typeof parsed === "object" && parsed !== null) {
            const result = {};
            Object.entries(parsed).forEach(([name, value]) => {
                // If value is truthy (1, true, "any string"), use default path
                if (value === true || value === 1 || (typeof value === "string" && value.startsWith("/"))) {
                    result[name] = typeof value === "string" && value.startsWith("/") ? value : `/${name}`;
                }
            });
            return result;
        }

        return null;
    } catch (e) {
        console.error("Error parsing custom links:", e);
        return null;
    }
}

function showError(message) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = `<div class="error">${message}</div>`;
}

function createLink(text, url, icon) {
    return `
        <a href="${url}" class="link-button" target="_blank" rel="noopener noreferrer">
            ${icon}
            <span>${text}</span>
        </a>
    `;
}

function init() {
    const { r, n, l } = getQueryParams();
    const linksContainer = document.getElementById("links-container");

    // Check if at least one parameter is provided
    if (!r && !n) {
        showError("❌ Error: You must provide at least one parameter (r or n)");
        return;
    }

    const links = [];

    // GitHub Pages link (requires "r")
    if (r) {
        document.getElementById("subtitle").innerHTML = `Repository: <span class="repo-name">${r}</span>`;

        links.push(createLink(
            "GitHub Pages",
            `https://wxn0brp.github.io/${r}/`,
            `<i class="devicon-github-original"></i>`
        ));

        // Custom links (only if "r" is provided)
        const customLinks = parseCustomLinks(l);
        if (customLinks) {
            Object.entries(customLinks).forEach(([name, path]) => {
                const fullUrl = `https://wxn0brp.github.io/${r}${path}`;
                links.push(createLink(
                    name.charAt(0).toUpperCase() + name.slice(1),
                    fullUrl,
                    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656
                        5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>`
                ));
            });
        }
    }

    // NPM package link (requires "n")
    if (n) {
        const pkgName = `@wxn0brp/${n}`;
        links.push(createLink(
            "NPM Package",
            `https://www.npmjs.com/package/${pkgName}`,
            `<i class="devicon-npm-original-wordmark"></i>`
        ));
    }

    // GitHub Repository link (always)
    const repoName = r || n;
    links.push(createLink(
        "GitHub Repository",
        `https://github.com/wxn0brP/${repoName}`,
        `<i class="devicon-github-original"></i>`
    ));

    linksContainer.innerHTML = links.join("");

}
init();