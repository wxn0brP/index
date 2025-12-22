import { RepoData, CategorizedRepos } from "./types";
import { getPrefix } from "./utils";

export function groupReposByPrefix(repos: RepoData[]): Map<string, RepoData[]> {
    const grouped = new Map<string, RepoData[]>();

    for (const repo of repos) {
        const prefix = getPrefix(repo.name);

        if (!grouped.has(prefix)) {
            grouped.set(prefix, []);
        }

        grouped.get(prefix)!.push(repo);
    }

    const result = new Map<string, RepoData[]>();
    const others: RepoData[] = [];

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

export function categorizeOthers(
    others: RepoData[],
    patterns: Record<string, string[]>
): CategorizedRepos {
    const categorized = new Map<string, RepoData[]>();
    const uncategorized: RepoData[] = [];

    for (const repo of others) {
        let matched = false;

        for (const [category, keywords] of Object.entries(patterns)) {
            for (const keyword of keywords) {
                if (repo.description && repo.description.toLowerCase().includes(keyword.toLowerCase())) {
                    if (!categorized.has(category)) {
                        categorized.set(category, []);
                    }
                    categorized.get(category)!.push(repo);
                    matched = true;
                    break;
                }
            }
            if (matched) break;
        }

        if (!matched) {
            uncategorized.push(repo);
        }
    }

    return { categorized, uncategorized };
}