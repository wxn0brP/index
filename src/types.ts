export interface Config {
    prefixRules: Record<string, string[]>;
    order: string[];
    alias: Record<string, string>;
    move?: Record<string, string>;
}

export interface RepoData {
    name: string;
    html_url: string;
    description: string | null;
    fork: boolean;
    archived: boolean;
    language: string | null;
}

export interface CategorizedRepos {
    categorized: Map<string, RepoData[]>;
    uncategorized: RepoData[];
}
