export function normalizeNpmPackageName(name: string) {
    if (name.startsWith("ValtheraDB")) name = name.replace("ValtheraDB", "db");
    if (name.match(/[A-Z]/))
        name = name[0] + name.slice(1).replace(/([A-Z])/g, "-$1");
    return `@wxn0brp/${name.toLowerCase()}`;
}
