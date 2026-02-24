# Google Scholar Stats Pipeline

This document explains how the portfolio fetches citations, h-index, and i10-index from Google Scholar, and whether you need permission from Google.

---

## Do I need permission from Google?

**No.** You do **not** need any permission from Google to use this pipeline.

- **Google does not offer an official Scholar API.** There is nothing to request permission for.
- **SerpApi** and **scholarly** are third-party tools. They scrape or access Scholar on your behalf. You don’t need Google’s approval.
- **SerpApi**: You sign up at serpapi.com and use their API key. They handle access to Scholar.
- **scholarly (Python)**: Open-source library that scrapes Scholar; you just install and run it.

---

## Pipeline overview (priority order)

| Source              | When used                                      | Needs API key?       |
|---------------------|------------------------------------------------|----------------------|
| `/scholar-stats.json` | Static file, updated by GitHub Action          | No                   |
| SerpApi             | When `SERPAPI_KEY` is set in Vercel            | Yes (free tier: 250/mo) |
| Direct HTML fetch   | Fallback; often blocked by Google              | No                   |
| Config fallback     | Last resort; manual values in `config.ts`      | No                   |

1. **Frontend** checks `/scholar-stats.json` (cached from GitHub Action).
2. If missing or invalid → calls `/api/scholar`.
3. **API** uses SerpApi when `SERPAPI_KEY` exists, else direct fetch, else fallback from config.

---

## Option A: SerpApi (recommended, reliable)

### 1. Get an API key

1. Go to [SerpApi signup](https://serpapi.com/users/sign_up?plan=free).
2. Create an account.
3. Find your API key in [Manage API Key](https://serpapi.com/manage-api-key).
4. **Free tier**: 250 searches/month. Failed/cached searches don’t count.

### 2. Add the key to Vercel

1. Open your project on [Vercel](https://vercel.com).
2. **Settings** → **Environment Variables**.
3. Add:

   - **Name**: `SERPAPI_KEY`  
   - **Value**: your SerpApi API key  
   - **Environment**: Production (and Preview if desired)

4. Redeploy so the new variable is available.

### 3. Test

Visit your site; stats should be loaded from SerpApi. Check the API response or network tab for `source: "serpapi"`.

---

## Option B: GitHub Action + scholarly (free, best-effort)

A weekly GitHub Action runs a Python script that fetches stats and commits `public/scholar-stats.json`.

### Requirements

- Repo hosted on GitHub.
- Workflow allowed to push (default for personal repos).

### How it works

- **Schedule**: Weekly on Sundays at 12:00 UTC.
- **Manual run**: **Actions** → **Update Scholar Stats** → **Run workflow**.
- **Script**: `scripts/fetch-scholar-stats.py` uses the `scholarly` library.
- **Output**: Updates `public/scholar-stats.json`, which the site serves as static data.

### Notes

- Google may block automated requests; this pipeline may fail sometimes.
- If it fails often, use SerpApi (Option A).
- To change the author, set `SCHOLAR_AUTHOR_ID` in the workflow or env (default: `0YSmKi4AAAAJ`).

---

## Similar examples

| Project / Tool                          | Approach                          | Permission from Google? |
|----------------------------------------|-----------------------------------|--------------------------|
| [SerpApi Google Scholar API](https://serpapi.com/google-scholar-author-api) | Third-party API                   | No                       |
| [scholarly (Python)](https://github.com/scholarly-python-package/scholarly) | Scraping Scholar                  | No                       |
| [scholar (R)](https://github.com/jkeirstead/scholar) | R package, scraping               | No                       |
| [h-index-reader](https://github.com/Proximify/h-index-reader) | Node.js, uses scholarly under hood | No                       |
| Google Scholar official API             | Does not exist                    | N/A                      |

---

## Troubleshooting

| Issue                          | What to do                                                                 |
|--------------------------------|----------------------------------------------------------------------------|
| Stats always show 0            | Add `SERPAPI_KEY` in Vercel, or run the GitHub Action to create `scholar-stats.json`. |
| SerpApi "Invalid API key"      | Check the key in Vercel env vars; redeploy.                               |
| SerpApi rate limit             | Free tier: 250/month. Upgrade or wait until next month.                    |
| GitHub Action fails            | Google may block scholarly. Switch to SerpApi (Option A).                 |
| Wrong author                  | Update `scholar.url` in `src/config.ts` with the correct Scholar profile URL. |

---

## Config reference

In `src/config.ts`:

```ts
scholar: {
  url: "https://scholar.google.com/citations?user=0YSmKi4AAAAJ&hl=en&oi=ao",
  fallback: { citations: 0, hIndex: 0, i10Index: 0 }
}
```

- **url**: Your Scholar profile URL. The `user=` part is used as the author ID.
- **fallback**: Values used when all automated sources fail.
