import { RepoData } from "./types";

const bracketTagPattern = /\[([^\]]+)\]/g;

function tagsFromText(text: string | null | undefined) {
	if (!text) return [];

	const tags: string[] = [];
	for (const match of text.matchAll(bracketTagPattern)) {
		for (const tag of match[1].split(",")) {
			const normalized = tag.trim().toLowerCase();
			if (normalized) tags.push(normalized);
		}
	}
	return tags;
}

export function getProjectTags(repo: RepoData) {
	return [
		...new Set([
			...(repo.topics || []),
			...tagsFromText(repo.description),
			...tagsFromText(repo.meta?.summary),
		]),
	].sort((a, b) => a.localeCompare(b));
}
