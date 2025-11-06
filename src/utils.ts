export function getPrefix(name: string): string {
    const parts = name.split("-");
    if (parts.length > 1) {
        return parts[0];
    }
    return name;
}