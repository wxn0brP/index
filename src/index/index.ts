import { clearCache } from "./api";
import { all, pinned } from "./data";
import { renderProjects } from "./render";
import { getProjectStatus } from "./status";
import { getProjectTags } from "./tags";
import { Data, RepoData, SortMode } from "./types";

declare const Fuse: any;

const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
const langFilter = document.querySelector<HTMLSelectElement>("#lang-filter")!;
const tagFilter = document.querySelector<HTMLSelectElement>("#tag-filter")!;
const statusFilter =
	document.querySelector<HTMLSelectElement>("#status-filter")!;
const sortSelect = document.querySelector<HTMLSelectElement>("#sort-select")!;
const resetFilters =
	document.querySelector<HTMLButtonElement>("#reset-filters")!;
const filtersToggle =
	document.querySelector<HTMLButtonElement>("#filters-toggle")!;
const filtersPanel = document.querySelector<HTMLElement>("#filters-panel")!;

const allRepos = all.flatMap(([, repos]) => repos);
const fuse = new Fuse(allRepos, {
	keys: [
		"name",
		"description",
		"meta.summary",
		"topics",
	],
	includeScore: true,
	threshold: 0.4,
});

function addOptions(select: HTMLSelectElement, values: string[]) {
	for (const value of values) {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = value;
		select.append(option);
	}
}

function uniqueSorted(values: (string | null | undefined)[]) {
	return [
		...new Set(values.filter(Boolean) as string[]),
	].sort((a, b) => a.localeCompare(b));
}

function repoAgeTime(repo: RepoData) {
	return repo.created_at
		? new Date(repo.created_at).getTime()
		: Number.POSITIVE_INFINITY;
}

function populateFilters() {
	addOptions(langFilter, uniqueSorted(allRepos.map(repo => repo.language)));
	addOptions(
		tagFilter,
		uniqueSorted(allRepos.flatMap(repo => getProjectTags(repo))),
	);
	addOptions(
		statusFilter,
		uniqueSorted(allRepos.map(repo => getProjectStatus(repo))),
	);
}

function sortedRepos(repos: RepoData[], sort: SortMode) {
	return [
		...repos,
	].sort((a, b) => {
		if (sort === "age") {
			const ageCompare = repoAgeTime(a) - repoAgeTime(b);
			if (ageCompare !== 0) return ageCompare;
		}
		if (sort === "lang") {
			const langCompare = (a.language || "").localeCompare(b.language || "");
			if (langCompare !== 0) return langCompare;
		}
		return a.name.localeCompare(b.name);
	});
}

function setUrlParams(params: Record<string, string>) {
	const query = new URLSearchParams(params);
	const search = query.toString();
	window.history.replaceState(
		null,
		"",
		`${window.location.pathname}${search ? `?${search}` : ""}`,
	);
}

function applyFilters() {
	const query = searchInput.value.trim();
	const lang = langFilter.value;
	const tag = tagFilter.value;
	const status = statusFilter.value;
	const sort = sortSelect.value as SortMode;
	const searchMatches = query
		? new Set(
				(
					fuse.search(query) as {
						item: RepoData;
					}[]
				).map(result => result.item),
			)
		: null;

	const matchesFilters = (repo: RepoData) => {
		if (searchMatches && !searchMatches.has(repo)) return false;
		if (lang && repo.language !== lang) return false;
		if (tag && !getProjectTags(repo).includes(tag)) return false;
		if (status && getProjectStatus(repo) !== status) return false;
		return true;
	};

	const filteredData = all
		.map(([category, repos]) => {
			const categoryRepos = repos.filter(matchesFilters);
			return [
				category,
				sortedRepos(categoryRepos, sort),
			];
		})
		.filter(([, repos]) => repos.length > 0) as Data[];

	if (sort !== "age") {
		filteredData.sort(([a], [b]) => a.localeCompare(b));
	}

	renderProjects(filteredData, pinned.filter(matchesFilters));
}

function selectFilter(filter: string, value: string) {
	const select = {
		lang: langFilter,
		status: statusFilter,
		tag: tagFilter,
	}[filter];
	if (!select) return;

	const option = [
		...select.options,
	].find(option => option.value === value);
	if (!option) return;

	select.value = value;
	applyFilters();
	setUrlParams({
		[filter]: value,
	});
	closeFilters();
	document.querySelector("main")?.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
}

function setFiltersOpen(open: boolean) {
	filtersPanel.classList.toggle("is-open", open);
	filtersToggle.setAttribute("aria-expanded", String(open));
}

function closeFilters() {
	setFiltersOpen(false);
}

function resetAllFilters() {
	searchInput.value = "";
	langFilter.value = "";
	tagFilter.value = "";
	statusFilter.value = "";
	sortSelect.value = "age";
	applyFilters();
	setUrlParams({});
}

populateFilters();
applyFilters();

for (const control of [
	searchInput,
	langFilter,
	tagFilter,
	statusFilter,
	sortSelect,
]) {
	control.addEventListener("input", applyFilters);
	control.addEventListener("change", applyFilters);
}

resetFilters.addEventListener("click", resetAllFilters);

filtersToggle.addEventListener("click", () => {
	setFiltersOpen(!filtersPanel.classList.contains("is-open"));
});

document.addEventListener("click", event => {
	const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
		"[data-filter][data-value]",
	);
	if (!button) return;
	selectFilter(button.dataset.filter || "", button.dataset.value || "");
});

document
	.querySelector<HTMLButtonElement>("#clear-cache")
	.addEventListener("click", e => {
		const conf =
			e.ctrlKey || confirm("Are you sure you want to clear the cache?");
		if (!conf) return;
		clearCache();
	});

const urlParam = new URLSearchParams(window.location.search);
const query = urlParam.get("q");
if (query) {
	searchInput.value = query;
	applyFilters();
}

const tag = urlParam.get("tag");
if (tag) {
	tagFilter.value = tag;
	applyFilters();
}

const lang = urlParam.get("lang");
if (lang) {
	langFilter.value = lang;
	applyFilters();
}

const status = urlParam.get("status");
if (status) {
	statusFilter.value = status;
	applyFilters();
}
