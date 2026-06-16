export interface NewsArticle {
  title: string;
  snippet: string;
  url: string;
}

export async function searchNews(companyName: string, mock: boolean): Promise<NewsArticle[]> {
  if (mock) {
    return [
      {
        title: `${companyName} launches new AI-driven hiring platform`,
        snippet: `${companyName} announced yesterday their new suite of agentic tools aiming to automate resume matching and forms parsing using generative models.`,
        url: "https://example.com/news/1"
      },
      {
        title: `VCs inject Series A round into ${companyName}`,
        snippet: `${companyName} raised $10M from major investors to scale their intelligent assistant solutions globally.`,
        url: "https://example.com/news/2"
      }
    ];
  }

  // Live scrape fallback with regex
  const query = `${companyName} news 2026`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      throw new Error(`DuckDuckGo error ${res.status}`);
    }
    const html = await res.text();
    
    // Parse using simple regular expressions for duckduckgo static HTML results
    const articles: NewsArticle[] = [];
    const resultReg = /<div class="result result--links[^"]*">([\s\S]*?)<\/div>/g;
    let match;
    
    while ((match = resultReg.exec(html)) !== null && articles.length < 3) {
      const block = match[1];
      const titleMatch = /<a class="result__url"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const snippetMatch = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const urlMatch = /href="([^"]+)"/i.exec(block);
      
      if (titleMatch && snippetMatch) {
        const cleanTitle = titleMatch[1].replace(/<[^>]*>/g, "").trim();
        const cleanSnippet = snippetMatch[1].replace(/<[^>]*>/g, "").trim();
        let cleanUrl = urlMatch ? urlMatch[1] : "";
        if (cleanUrl.startsWith("//")) {
          cleanUrl = "https:" + cleanUrl;
        }
        articles.push({
          title: cleanTitle,
          snippet: cleanSnippet,
          url: cleanUrl
        });
      }
    }
    
    return articles;
  } catch (e: any) {
    // If rate limited or blocked (common from CF IPs), return empty array
    return [];
  }
}
