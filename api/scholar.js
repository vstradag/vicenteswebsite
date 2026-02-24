/**
 * Google Scholar stats pipeline
 *
 * PIPELINE (priority order):
 * 1. SerpApi – when SERPAPI_KEY is set, fetches structured data (recommended)
 * 2. Direct fetch – tries to parse Scholar HTML (often blocked by Google)
 * 3. Fallback – config.scholar.fallback values
 *
 * DO YOU NEED GOOGLE PERMISSION?
 * No. Google does not provide an official Scholar API. SerpApi is a third-party
 * service that scrapes Scholar for you – you don't need any Google approval.
 * See docs/SCHOLAR_PIPELINE.md for full setup.
 */

const DEFAULT_SCHOLAR_URL =
  "https://scholar.google.com/citations?user=0YSmKi4AAAAJ&hl=en&oi=ao";

/** Extract author_id from Scholar profile URL (e.g. user=0YSmKi4AAAAJ) */
function extractAuthorId(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/[?&]user=([^&]+)/);
  return m ? m[1] : null;
}

/** Build SerpApi request URL for Google Scholar Author */
function buildSerpApiUrl(authorId, apiKey) {
  const params = new URLSearchParams({
    engine: "google_scholar_author",
    author_id: authorId,
    hl: "en",
    api_key: apiKey,
  });
  return `https://serpapi.com/search.json?${params.toString()}`;
}

/** Parse SerpApi cited_by.table into { citations, hIndex, i10Index } */
function parseSerpApiCitedBy(citedBy) {
  if (!citedBy?.table || !Array.isArray(citedBy.table)) return null;
  let citations = 0,
    hIndex = 0,
    i10Index = 0;
  for (const row of citedBy.table) {
    if (row.citations?.all != null) citations = parseInt(row.citations.all, 10);
    if (row.indice_h?.all != null)
      hIndex = parseInt(row.indice_h.all, 10);
    else if (row.h_index?.all != null)
      hIndex = parseInt(row.h_index.all, 10);
    if (row.indice_i10?.all != null)
      i10Index = parseInt(row.indice_i10.all, 10);
    else if (row.i10_index?.all != null)
      i10Index = parseInt(row.i10_index.all, 10);
  }
  return { citations, hIndex, i10Index };
}

/** Try to parse stats from Scholar HTML (fragile – Google often blocks) */
function parseScholarHtml(html, fallback) {
  let citations = fallback.citations;
  let hIndex = fallback.hIndex;
  let i10Index = fallback.i10Index;

  const citedMatch =
    html.match(/Cited by[\s\S]*?(\d[\d,]*)/i) ||
    html.match(/gsc_oci_cited_by[\s\S]*?(\d+)/);
  if (citedMatch) {
    citations =
      parseInt(String(citedMatch[1]).replace(/,/g, ""), 10) || fallback.citations;
  }

  const hMatch =
    html.match(/h-?index[\s\S]*?(\d+)/i) || html.match(/h_index[\s\S]*?(\d+)/);
  if (hMatch) hIndex = parseInt(hMatch[1], 10) || fallback.hIndex;

  const i10Match =
    html.match(/i10-?index[\s\S]*?(\d+)/i) ||
    html.match(/i10_index[\s\S]*?(\d+)/);
  if (i10Match) i10Index = parseInt(i10Match[1], 10) || fallback.i10Index;

  return { citations, hIndex, i10Index };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = req.query || {};
  const scholarUrl = query.url || DEFAULT_SCHOLAR_URL;
  let fallback = { citations: 0, hIndex: 0, i10Index: 0 };
  try {
    if (query.fallback) fallback = JSON.parse(query.fallback);
  } catch (_) {}

  const apiKey = process.env.SERPAPI_KEY;

  // --- 1. SerpApi pipeline (recommended) ---
  if (apiKey) {
    const authorId = extractAuthorId(scholarUrl);
    if (authorId) {
      try {
        const serpUrl = buildSerpApiUrl(authorId, apiKey);
        const response = await fetch(serpUrl);
        const data = await response.json();

        if (data.error) {
          console.warn("SerpApi error:", data.error);
          // fall through to direct fetch or fallback
        } else if (data.cited_by) {
          const parsed = parseSerpApiCitedBy(data.cited_by);
          if (parsed) {
            return res.status(200).json({
              citations: parsed.citations,
              hIndex: parsed.hIndex,
              i10Index: parsed.i10Index,
              source: "serpapi",
            });
          }
        }
      } catch (err) {
        console.warn("SerpApi fetch failed:", err.message);
      }
    }
  }

  // --- 2. Direct fetch (often blocked) ---
  try {
    const response = await fetch(scholarUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (response.ok) {
      const html = await response.text();
      const parsed = parseScholarHtml(html, fallback);
      return res.status(200).json({
        ...parsed,
        source: parsed.citations || parsed.hIndex || parsed.i10Index ? "html" : "fallback",
      });
    }
  } catch (err) {
    console.warn("Scholar direct fetch failed:", err.message);
  }

  // --- 3. Fallback ---
  return res.status(200).json({
    ...fallback,
    source: "fallback",
  });
}
