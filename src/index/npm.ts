const EXCEPTIONS: Record<string, string> = {
	"biome-config": "biome",
	AnotherCache: "ac",
	"GlovesLink-server-limit": "gls-limit",
	VQL: "vql",
};

const PREFIXES: Record<string, string> = {
	ValtheraDB: "db",
};

export function normalizeNpmPackageName(name: string) {
	if (name in EXCEPTIONS) return `@wxn0brp/${EXCEPTIONS[name]}`;

	for (const [prefix, replacement] of Object.entries(PREFIXES)) {
		if (name.startsWith(prefix)) {
			name = replacement + name.slice(prefix.length);
			break;
		}
	}

	name = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2");
	return `@wxn0brp/${name.toLowerCase()}`;
}
