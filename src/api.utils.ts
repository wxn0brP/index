async function fetchReposPage(owner: string, page: number): Promise<any[]> {
    const url = `https://api.github.com/users/${owner}/repos?per_page=100&page=${page}`;
    return await fetch(url).then((r) => r.json());
}

export async function fetchRepoPages(owner: string): Promise<any[]> {
    const repos = [];
    let page = 1;
    while (true) {
        const pageRepos = await fetchReposPage(owner, page);
        if (pageRepos.length === 0) break;
        repos.push(...pageRepos);
        page++;
    }
    return repos;
}