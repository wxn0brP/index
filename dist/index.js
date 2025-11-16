// src/api.ts
var chachKey = "wxn/project-catalog/cache";
var ttl = 10 * 60 * 1000;
function getCache(key) {
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
function setCache(key, data) {
  key = `${chachKey}/${key}`;
  localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
}
function clearCache() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(chachKey));
  for (const key of keys)
    localStorage.removeItem(key);
}
async function fetchRepos(owner) {
  const cached = getCache("repos");
  if (cached)
    return cached;
  const repos = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100`).then((r) => r.json());
  const map = repos.map((r) => ({
    name: r.name,
    html_url: r.html_url,
    description: r.description,
    fork: r.fork,
    archived: r.archived,
    language: r.language
  }));
  setCache("repos", map);
  return map;
}
async function checkGitHubPages(username, repoName) {
  const key = `pages-${repoName}`;
  const cached = getCache(key);
  if (cached)
    return cached;
  const data = await _checkGitHubPages(username, repoName);
  setCache(key, data);
  return data;
}
async function _checkGitHubPages(username, repoName) {
  const baseUrl = `https://${username}.github.io/${repoName}`;
  const possibleUrls = [
    baseUrl,
    baseUrl + "/docs"
  ];
  try {
    const settingsResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/pages`, {
      headers: {
        Accept: "application/vnd.github.v3+json"
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
            url,
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
async function checkNpmPackage(username, repoName) {
  const key = `npm-${repoName}`;
  const cached = getCache(key);
  if (cached)
    return cached;
  const data = await _checkNpmPackage(username, repoName);
  setCache(key, data);
  return data;
}
async function _checkNpmPackage(username, repoName) {
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

// src/utils.ts
function getPrefix(name) {
  if (!name) {
    return "";
  }
  let parts;
  if (name[0] === name[0].toUpperCase()) {
    parts = name.split(/[-_]/);
  } else {
    parts = name.split(/(?<=[a-z])(?=[A-Z])|[-_]/);
  }
  if (parts.length > 1) {
    return parts[0];
  }
  return name;
}

// src/category.ts
function groupReposByPrefix(repos) {
  const grouped = new Map;
  for (const repo of repos) {
    const prefix = getPrefix(repo.name);
    if (!grouped.has(prefix)) {
      grouped.set(prefix, []);
    }
    grouped.get(prefix).push(repo);
  }
  const result = new Map;
  const others = [];
  for (const [prefix, items] of grouped.entries()) {
    if (items.length < 2) {
      others.push(...items);
    } else {
      result.set(prefix, items);
    }
  }
  if (others.length > 0) {
    result.set("others", others);
  }
  return result;
}
function categorizeOthers(others, patterns) {
  const categorized = new Map;
  const uncategorized = [];
  for (const repo of others) {
    let matched = false;
    for (const [category, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (repo.description && repo.description.toLowerCase().includes(keyword.toLowerCase())) {
          if (!categorized.has(category)) {
            categorized.set(category, []);
          }
          categorized.get(category).push(repo);
          matched = true;
          break;
        }
      }
      if (matched)
        break;
    }
    if (!matched) {
      uncategorized.push(repo);
    }
  }
  return { categorized, uncategorized };
}

// src/data.ts
var config = await fetch("res/config.json").then((r) => r.json());
var repos = await fetchRepos("wxn0brP");
var allCategories = groupReposByPrefix(repos);
var categories = categorizeOthers(allCategories.get("others"), config.prefixRules);
allCategories.delete("others");
var allMap = new Map;
for (const [category, repos2] of categories.categorized) {
  allMap.set(category, repos2);
}
for (const [category, repos2] of allCategories) {
  allMap.set(category, repos2);
}
allMap.set("Uncategorized", categories.uncategorized);
for (const alias of Object.entries(config.alias)) {
  allMap.set(alias[1], allMap.get(alias[0]));
  allMap.delete(alias[0]);
}
if (config.move) {
  for (const [projectName, newCategory] of Object.entries(config.move)) {
    let repoToMove;
    let oldCategory;
    for (const [category, repos2] of allMap.entries()) {
      const repoIndex = repos2.findIndex((repo) => repo.name === projectName);
      if (repoIndex !== -1) {
        repoToMove = repos2[repoIndex];
        oldCategory = category;
        repos2.splice(repoIndex, 1);
        if (repos2.length === 0) {
          allMap.delete(category);
        }
        break;
      }
    }
    if (repoToMove) {
      if (!allMap.has(newCategory))
        allMap.set(newCategory, []);
      allMap.get(newCategory).unshift(repoToMove);
    }
  }
}
var all = [];
for (const category of config.order) {
  if (allMap.has(category)) {
    all.push([category, allMap.get(category)]);
    allMap.delete(category);
  }
}
all.push(...allMap.entries());

// src/render.ts
var main = document.querySelector("main");
var popup = document.querySelector("#popup");
var popupTitle = document.querySelector("#popup-title");
var ghPagesStatus = document.querySelector("#gh-pages-status");
var npmStatus = document.querySelector("#npm-status");
var closeBtn = document.querySelector(".close-btn");
closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
});
popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.style.display = "none";
  }
});
var langMap = {
  "C++": "cplusplus",
  "C#": "csharp",
  CSS: "css3",
  HTML: "html5",
  Shell: "bash"
};
var link = (name) => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;
async function showDetails(repo) {
  popupTitle.textContent = `${repo.name} Details`;
  ghPagesStatus.innerHTML = `<span class="info-value">Loading...</span>`;
  npmStatus.innerHTML = `<span class="info-value">Loading...</span>`;
  popup.style.display = "flex";
  try {
    checkGitHubPages("wxn0brP", repo.name).then((ghPages) => {
      ghPagesStatus.innerHTML = ghPages?.enabled ? `<span class="status-badge status-yes">Yes</span> - <a href="${ghPages.url}" target="_blank">${ghPages.url}</a>` : `<span class="status-badge status-no">No</span>`;
    });
    checkNpmPackage("wxn0brP", repo.name).then((npm) => {
      npmStatus.innerHTML = npm?.exists && npm?.published ? `<span class="status-badge status-yes">Yes</span> -
                <a href="https://www.npmjs.com/package/${npm.name}" target="_blank">${npm.name}@${npm.version}</a>` : `<span class="status-badge status-no">No</span>`;
    });
  } catch (error) {
    console.error(`Error loading details for ${repo.name}:`, error);
    ghPagesStatus.innerHTML = `<span class="status-badge status-no">Error loading data</span>`;
    npmStatus.innerHTML = `<span class="status-badge status-no">Error loading data</span>`;
  }
}
function renderProjects(data) {
  let html = ``;
  for (const obj of data) {
    const [category, repos2] = obj;
    if (repos2.length > 0) {
      html += `<h2>${category}</h2>`;
      html += `<ul>`;
      for (const repo of repos2) {
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
  document.querySelectorAll(".details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const repoName = btn.getAttribute("data-repo");
      const repos2 = data.flatMap(([_, repos3]) => repos3);
      const repo = repos2.find((r) => r.name === repoName);
      if (repo)
        showDetails(repo);
    });
  });
}

// src/index.ts
renderProjects(all);
var allRepos = all.flatMap(([, repos2]) => repos2);
var fuse = new Fuse(allRepos, {
  keys: ["name", "description"],
  includeScore: true,
  threshold: 0.4
});
var searchInput = document.querySelector("input");
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  if (query.length === 0) {
    renderProjects(all);
    return;
  }
  const results = fuse.search(query);
  const filteredRepos = results.map((result) => result.item);
  const filteredData = all.map(([category, repos2]) => {
    const categoryRepos = repos2.filter((repo) => filteredRepos.includes(repo));
    return [category, categoryRepos];
  }).filter(([, repos2]) => repos2.length > 0);
  renderProjects(filteredData);
});
document.querySelector("#clear-cache").addEventListener("click", (e) => {
  const conf = e.ctrlKey || confirm("Are you sure you want to clear the cache?");
  if (!conf)
    return;
  clearCache();
});
var urlParam = new URLSearchParams(window.location.search);
var query = urlParam.get("q");
if (query) {
  searchInput.value = query;
  searchInput.dispatchEvent(new Event("input"));
}
var details = urlParam.get("d");
if (details) {
  const repo = allRepos.find((repo2) => repo2.name === details);
  if (repo)
    showDetails(repo);
}
