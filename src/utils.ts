export function getPrefix(name: string): string {
    if (!name) {
        return "";
    }
    let parts: string[];
    if (name[0] === name[0].toUpperCase()) { // PascalCase
        parts = name.split(/[-_]/);
    } else {
        parts = name.split(/(?<=[a-z])(?=[A-Z])|[-_]/); // snake_case / kebab-case / camelCase
    }

    if (parts.length > 1) {
        return parts[0];
    }
    return name;
}