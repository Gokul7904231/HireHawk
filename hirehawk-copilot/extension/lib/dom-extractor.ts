import TurndownService from "turndown";

export function cleanHtml(html: string): string {
  // Strip script, style, nav, footer, and other noisy selectors
  return html
    .replace(/<(script|style|nav|footer|header)[^>]*>([\s\S]*?)<\/\1>/gi, "")
    .replace(/<[^>]*class="[^"]*(cookie|banner|consent)[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/gi, "")
    .trim();
}

export function extractMarkdown(html: string): string {
  const cleaned = cleanHtml(html);
  // Instantiate Turndown
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced"
  });
  return turndownService.turndown(cleaned);
}
