import { RepoData } from "./types";

const chachKey = "wxn/project-catalog/cache";
const ttl = 10 * 60 * 1000;
function getCache(key: string) {
    key = `${chachKey}/${key}`;
    const cache = localStorage.getItem(key);
    if (cache) {
        if (Date.now() - JSON.parse(cache).time > ttl) {
            localStorage.removeItem(key);
        } else {
            return JSON.parse(cache).data;
        }
    }
    return null;
}

function setCache(key: string, data: any) {
    key = `${chachKey}/${key}`;
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
}

export function clearCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(chachKey));
    for (const key of keys)
        localStorage.removeItem(key);
}

export async function fetchRepos(owner: string): Promise<RepoData[]> {
    const cached = getCache("repos");
    if (cached) return cached;

    const repos = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100`).then((r) => r.json()) as RepoData[];
    const map = repos.map((r) => ({
        name: r.name,
        html_url: r.html_url,
        description: r.description,
        fork: r.fork,
        archived: r.archived,
        language: r.language,
    }));

    setCache("repos", map);
    return map;
}
export async function checkGitHubPages(username: string, repoName: string) {
    const key = `pages-${repoName}`;
    const cached = getCache(key);
    if (cached) return cached;

    const data = await _checkGitHubPages(username, repoName);
    setCache(key, data);
    return data;
}

async function _checkGitHubPages(username: string, repoName: string) {
    const baseUrl = `https://${username}.github.io/${repoName}`;
    const possibleUrls = [
        baseUrl,
        baseUrl + "/docs"
    ];

    try {
        const settingsResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
            headers: {
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (settingsResponse.ok) {
            const pagesData = await settingsResponse.json();
            if (pagesData.source) {
                return {
                    enabled: true,
                    status: "enabled",
                    url: pagesData.html_url || possibleUrls[0],
                    source: pagesData.source
                };
            }
        }

        for (const url of possibleUrls) {
            try {
                const response = await fetch(url, { method: "HEAD" });
                if (response.ok) {
                    return {
                        enabled: true,
                        status: "accessible",
                        url: url,
                        source: "unknown"
                    };
                }
            } catch (error) {
                continue;
            }
        }

        return {
            enabled: false,
            status: "disabled",
            url: null,
            source: null
        };
    } catch (error) {
        console.error(`Error checking GitHub Pages for ${username}/${repoName}:`, error);
    }
    return {
        enabled: false,
        status: "error",
        url: null,
        source: null
    };
}

export async function checkNpmPackage(username: string, repoName: string) {
    const key = `npm-${repoName}`;
    const cached = getCache(key);
    if (cached) return cached;

    const data = await _checkNpmPackage(username, repoName);
    setCache(key, data);
    return data;
}

async function _checkNpmPackage(username: string, repoName: string) {
    try {
        const packageJsonUrl = `https://raw.githubusercontent.com/${username}/${repoName}/main/package.json`;
        const response = await fetch(packageJsonUrl);

        if (!response.ok) {
            const branches = ["master", "main", "develop"];
            let packageFound = false;

            for (const branch of branches) {
                const alternativeUrl = `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/package.json`;
                const altResponse = await fetch(alternativeUrl);

                if (altResponse.ok) {
                    const packageData = await altResponse.json();

                    if (packageData.name) {
                        const npmResponse = await fetch(`https://registry.npmjs.org/${packageData.name}`);

                        if (npmResponse.ok) {
                            const npmData = await npmResponse.json();

                            return {
                                exists: true,
                                name: packageData.name,
                                version: npmData["dist-tags"]?.latest || "unknown",
                                published: true
                            };
                        } else {
                            return {
                                exists: true,
                                name: packageData.name,
                                version: packageData.version || "unknown",
                                published: false
                            };
                        }
                    }
                    packageFound = true;
                    break;
                }
            }

            if (!packageFound) {
                return {
                    exists: false,
                    name: null,
                    version: null,
                    published: false
                };
            }
        } else {
            const packageData = await response.json();

            if (packageData.name) {
                const npmResponse = await fetch(`https://registry.npmjs.org/${packageData.name}`);

                if (npmResponse.ok) {
                    const npmData = await npmResponse.json();

                    return {
                        exists: true,
                        name: packageData.name,
                        version: npmData["dist-tags"]?.latest || "unknown",
                        published: true
                    };
                } else {
                    return {
                        exists: true,
                        name: packageData.name,
                        version: packageData.version || "unknown",
                        published: false
                    };
                }
            } else {
                return {
                    exists: true,
                    name: null,
                    version: packageData.version || "unknown",
                    published: false
                };
            }
        }
    } catch (error) {
        console.error(`Error checking npm package for ${username}/${repoName}:`, error);
    }
    return {
        exists: false,
        name: null,
        version: null,
        published: false
    };
}