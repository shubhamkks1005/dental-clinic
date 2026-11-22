const TITLE = /^(dr\.?)\s+/i;

// For greetings and short messages: "Dr. Nidhi Kushwaha" -> "Dr. Nidhi", "Meena Test" -> "Meena".
export function shortName(name: string): string {
  const title = TITLE.exec(name)?.[1];
  const first = name.replace(TITLE, "").split(/\s+/)[0] ?? name;
  return title ? `${title} ${first}` : first;
}

// Avatar letters without the title: "Dr. Nidhi Kushwaha" -> "NK".
export function initials(name: string): string {
  return name
    .replace(TITLE, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
