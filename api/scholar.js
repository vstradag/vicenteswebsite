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

/** Parse SerpApi cited_by.table into { citations, hIndex, i10Index }.
 *  Field names are locale-dependent (e.g. h_index in English, indice_h in
 *  French), so we match keys by pattern instead of exact name. */
function parseSerpApiCitedBy(citedBy) {
  if (!citedBy?.table || !Array.isArray(citedBy.table)) return null;
  let citations = 0,
    hIndex = 0,
    i10Index = 0;

  for (const row of citedBy.table) {
    for (const [key, value] of Object.entries(row)) {
      if (!value || typeof value !== "object" || value.all == null) continue;
      const num = parseInt(String(value.all), 10);
      if (isNaN(num)) continue;

      const k = key.toLowerCase();
      if (/citation/.test(k)) {
        citations = num;
      } else if (/i10|i_10/.test(k)) {
        i10Index = num;
      } else if (/\bh\b|h[_-]?ind|ind[a-z]*[_-]?h/.test(k)) {
        hIndex = num;
      }
    }
  }
  return { citations, hIndex, i10Index };
}

/** Try to parse stats from Scholar HTML (fragile – Google often blocks).
 *  The stats table (#gsc_rsb_st) has three data rows, each with two
 *  gsc_rsb_std cells: the first is "All", the second is "Since YYYY".
 *  We only take the first cell (All) from each row. */
function parseScholarHtml(html, fallback) {
  let citations = fallback.citations;
  let hIndex = fallback.hIndex;
  let i10Index = fallback.i10Index;

  const tableMatch = html.match(/id\s*=\s*"gsc_rsb_st"[\s\S]*?<\/table>/i);
  if (tableMatch) {
    const table = tableMatch[0];
    const rowRe =
      /<tr[^>]*>[\s\S]*?<td[^>]*class="gsc_rsb_sc1"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*class="gsc_rsb_std"[^>]*>([\d,]+)<\/td>/gi;
    let m;
    while ((m = rowRe.exec(table)) !== null) {
      const label = m[1].replace(/<[^>]*>/g, "").trim().toLowerCase();
      const num = parseInt(m[2].replace(/,/g, ""), 10);
      if (isNaN(num)) continue;

      if (/citation/.test(label)) {
        citations = num;
      } else if (/i10/.test(label)) {
        i10Index = num;
      } else if (/h.?index/.test(label)) {
        hIndex = num;
      }
    }
    return { citations, hIndex, i10Index };
  }

  const citedMatch = html.match(/Citations<\/a><\/td>\s*<td[^>]*>(\d[\d,]*)/i);
  if (citedMatch)
    citations = parseInt(citedMatch[1].replace(/,/g, ""), 10) || fallback.citations;

  const hMatch = html.match(/h-?index<\/a><\/td>\s*<td[^>]*>(\d+)/i);
  if (hMatch) hIndex = parseInt(hMatch[1], 10) || fallback.hIndex;

  const i10Match = html.match(/i10-?index<\/a><\/td>\s*<td[^>]*>(\d+)/i);
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
