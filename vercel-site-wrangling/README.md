# Rocking

## Data Wrangling Steps for Vercel Docs

1. Fetch main sitemap
   - Source: `https://vercel.com/sitemap.xml`
   - Saved as: [`wrangling/vercel-raw-xml`](wrangling/vercel-raw-xml)

2. Extract docs-only sitemap
   - Filtered to URLs under `https://vercel.com/docs/`
   - Saved as: [`wrangling/vercel-docs-urls.md`](wrangling/vercel-docs-urls.md)

3. Label URLs by relevance (1/0)
   - Criteria terms (case-insensitive): `getting-started`, `frameworks`, `compute`, `build`, `deploy`, `deployment`, `deployments`, `serverless-functions`, `edge-functions`, `cron-jobs`, `environment-variables`, `projects`, `cli`, `guide`, `guides`
   - Output CSV: [`wrangling/vercel-docs-urls-labeled.csv`](wrangling/vercel-docs-urls-labeled.csv)

4. Next step (pending)
   - Curate a more focused list.
   - Current working file (not final): [`wrangling/vercel-docs-filtered.md`](wrangling/vercel-docs-filtered.md)

5. Selection (from labeled rows)
   - Keep only rows labeled `1` in the CSV.
   - Output: [`wrangling/vercel-docs-selection.md`](wrangling/vercel-docs-selection.md)

