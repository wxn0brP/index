import { ProjectStatus, RepoData } from "./types";

const experimentalPattern = /\b(wip|poc)\b/i;

export function getProjectStatus(repo: RepoData): ProjectStatus {
    if (repo.archived) return "archived";
    if (repo.fork) return "fork";

    const searchable = [
        repo.name,
        repo.description || "",
        repo.meta?.summary || "",
    ].join(" ");

    if (experimentalPattern.test(searchable)) return "experimental";
    return "active";
}
