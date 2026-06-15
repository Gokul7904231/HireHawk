import { describe, it, expect } from "vitest";
import { cleanHtml, extractMarkdown } from "../lib/dom-extractor";

describe("DOM Capture & Clean", () => {
  it("cleans noisy scripts, styles, footers, and cookie banners", () => {
    const rawHtml = `
      <nav class="nav-class">Navigation Items</nav>
      <header>Welcome Header</header>
      <main>
        <h1>AI Engineer Intern</h1>
        <p>Breathe ESG is hiring.</p>
      </main>
      <script>console.log("noisy tracking script")</script>
      <style>.cookie-banner { display: block; }</style>
      <div class="cookie-consent-banner">We use cookies. <button>Accept</button></div>
      <footer>Footer contents here</footer>
    `;

    const cleaned = cleanHtml(rawHtml);
    expect(cleaned).toContain("AI Engineer Intern");
    expect(cleaned).toContain("Breathe ESG is hiring.");
    expect(cleaned).not.toContain("Navigation Items");
    expect(cleaned).not.toContain("console.log");
    expect(cleaned).not.toContain("We use cookies.");
  });

  it("converts cleaned HTML into clean markdown text", () => {
    const rawHtml = `
      <h1>AI Engineer Intern</h1>
      <p>Breathe ESG is seeking a <strong>React</strong> developer.</p>
    `;

    const markdown = extractMarkdown(rawHtml);
    expect(markdown).toContain("# AI Engineer Intern");
    expect(markdown).toContain("Breathe ESG is seeking a **React** developer.");
  });
});
