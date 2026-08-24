export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatTags = (tags?: string[]): string => {
  if (!Array.isArray(tags) || tags.length === 0) return "";

  return tags
    .map((item) => {
      // 1. Remove existing '#' symbols and trim whitespace
      const clean = item.replace(/^#+/, "").trim();

      // 2. Replace spaces/hyphens with underscores, remove non-alphanumeric chars
      const sanitized = clean
        .replace(/[\s-]+/g, "_")
        .replace(/[^\p{L}\p{N}_]/gu, "");

      return sanitized ? `#${sanitized}` : "";
    })
    .filter(Boolean)
    .join(" ");
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength - 3) + "..." : str;
}
