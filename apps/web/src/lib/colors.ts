export const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Ruby: "#701516",
    Go: "#00ADD8",
    Rust: "#dea584",
    HTML: "#e34c26",
    CSS: "#563d7c",
    PHP: "#4F5D95",
    Vue: "#41b883",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Shell: "#89e051",
    ObjectiveC: "#438eff",
    Scala: "#c22d40",
    Elixir: "#6e4a7e",
    Clojure: "#db5855",
    Haskell: "#5e5086",
    Lua: "#000080",
    Perl: "#0298c3",
    R: "#198CE7",
    Svelte: "#ff3e00",
    HolyC: "#ffef28",
};

export function getLanguageColor(language?: string | null): string {
    if (!language) return "#8b949e";
    return LANGUAGE_COLORS[language] || "#8b949e";
}
