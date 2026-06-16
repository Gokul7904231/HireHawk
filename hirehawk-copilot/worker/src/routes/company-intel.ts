import { Env } from "../types";
import { queryWikidata } from "../lib/wikidata";
import { searchNews } from "../lib/duckduckgo";
import { getLogoUrl } from "../lib/logo";

export async function handleCompanyIntel(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const companyName = url.searchParams.get("name");
  const domain = url.searchParams.get("domain") || "";

  if (!companyName) {
    return new Response(JSON.stringify({ error: "Missing name query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const mockMode = env.GEMINI_MOCK !== "false";

  if (mockMode) {
    const mockNews = await searchNews(companyName, true);
    return new Response(
      JSON.stringify({
        company_name: companyName,
        founding_year: 2020,
        hq_location: "Bangalore, India",
        industry: "Sustainability Software",
        website: "https://breatheesg.com",
        logo_url: getLogoUrl(domain || "breatheesg.com", env.LOGO_DEV_TOKEN),
        recent_news: mockNews,
        data_availability: "full"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const wikidataPromise = queryWikidata(companyName);
    const newsPromise = searchNews(companyName, false);
    const logoUrl = getLogoUrl(domain || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`, env.LOGO_DEV_TOKEN);

    const [wikiRes, newsRes] = await Promise.allSettled([wikidataPromise, newsPromise]);

    const wiki = wikiRes.status === "fulfilled" ? wikiRes.value : null;
    const news = newsRes.status === "fulfilled" ? newsRes.value : [];

    let dataAvailability: "full" | "partial" | "none" = "none";
    if (wiki && news && news.length > 0) {
      dataAvailability = "full";
    } else if (wiki || (news && news.length > 0)) {
      dataAvailability = "partial";
    }

    return new Response(
      JSON.stringify({
        company_name: wiki?.company_name || companyName,
        founding_year: wiki?.founding_year || null,
        hq_location: wiki?.hq_location || null,
        industry: wiki?.industry || null,
        website: wiki?.website || null,
        logo_url: logoUrl,
        recent_news: news || [],
        data_availability: dataAvailability
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
