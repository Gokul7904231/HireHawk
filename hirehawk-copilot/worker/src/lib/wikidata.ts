export async function queryWikidata(companyName: string): Promise<any> {
  const sparql = `
    SELECT ?companyLabel ?inception ?industryLabel ?website WHERE {
      ?company wdt:P31/wdt:P279* wd:Q4830453 ;
               rdfs:label "${companyName}"@en ;
               wdt:P571 ?inception ;
               wdt:P452 ?industry ;
               wdt:P856 ?website .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 1`;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  
  const res = await fetch(url, {
    headers: { "User-Agent": "HireHawkCopilot/1.0" }
  });
  if (!res.ok) {
    throw new Error(`Wikidata error ${res.status}`);
  }
  const data = (await res.json()) as any;
  const binding = data.results?.bindings?.[0];
  if (!binding) return null;

  return {
    company_name: binding.companyLabel?.value || companyName,
    founding_year: binding.inception?.value ? new Date(binding.inception.value).getFullYear() : null,
    industry: binding.industryLabel?.value || null,
    website: binding.website?.value || null
  };
}
