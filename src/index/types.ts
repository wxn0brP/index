export interface Config {
	prefixRules: Record<string, string[]>;
	order: string[];
	alias: Record<string, string>;
	move?: Record<string, string>;
	pinned?: string[];
	projects?: Record<string, ProjectMeta>;
}

export type ProjectStatus = "active" | "archived" | "fork" | "experimental";

export interface ProjectMeta {
	status?: "active";
	summary?: string;
	links?: Record<string, string>;
}

export interface RepoData {
	name: string;
	html_url: string;
	description: string | null;
	fork: boolean;
	archived: boolean;
	language: string | null;
	homepage: string | null;
	created_at?: string;
	topics?: string[];
	meta?: ProjectMeta;
}

export interface CategorizedRepos {
	categorized: Map<string, RepoData[]>;
	uncategorized: RepoData[];
}

export type Data = [
	string,
	RepoData[],
];
export type SortMode = "age" | "name" | "lang";
