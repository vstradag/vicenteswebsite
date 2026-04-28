export type DeveloperNameLines = {
  firstLine: string;
  secondLine: string;
};

export function getDeveloperNameLines(fullName: string, fallbackFirstLine = "Vicente"): DeveloperNameLines {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstLine = nameParts[0] || fallbackFirstLine;
  const secondLine = nameParts.slice(1).join(" ") || "Estrada Gonzalez";

  return { firstLine, secondLine };
}
