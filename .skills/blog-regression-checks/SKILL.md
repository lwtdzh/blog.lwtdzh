---
name: blog-regression-checks
description: Step-by-step regression checklist for this Cloudflare Pages blog, covering public pages, APIs, admin flows, content build helpers, and known edge cases after code or content changes.
---

# Blog Regression Checks

Use this skill when validating changes to this repository.

## Safety

- The current Playwright setup targets the live site by default via `BASE_URL`, so do not assume it is a hermetic local suite.
- Some checks are stateful and will mutate live data such as visitor counts, comments, or GitHub-backed admin content.
- Some admin checks also require secrets such as `ADMIN_PASSWORD`, `GITHUB_TOKEN`, or `CLOUDFLARE_DEPLOY_HOOK`.
- Keep the existing uncommitted diff in `src/generated/articles.ts` unless the task explicitly includes reconciling generated article data.
- Before running anything stateful, check `git status --short` and confirm whether the target environment is safe to mutate.

Labels:
- `read-only`: safe inspection or non-mutating verification
- `stateful`: changes remote data, counters, comments, or content
- `secrets-required`: depends on admin credentials or deployment secrets

## Workflow

Run the checklist top-to-bottom after any meaningful change. Stop and investigate on the first regression.

### 1. Baseline Prep

- `read-only` Confirm repo state with `git status --short`.
- `read-only` Review whether the change touches public rendering, APIs, admin flows, article parsing, or deployment hooks.
- `read-only` If you plan to use Playwright, verify `BASE_URL` and remember it defaults to the deployed site.
- `read-only` Run `npm run build` and note whether `src/generated/articles.ts` changes, because generated-article drift is itself a regression signal.

### 2. Public Smoke Checks

- `read-only` Homepage renders site chrome, post count, tag count, visitor placeholders, comment-count placeholders, and footer friend-links container.
- `read-only` Paginated homepage still shows newest visible posts first and hides hidden posts from lists.
- `read-only` Archives page lists all visible posts and groups by year.
- `read-only` Year archive and year-month archive routes still filter correctly.
- `read-only` Tag pages still show only visible posts for the selected tag.
- `read-only` Direct article routes still render title, metadata, markdown body, tags, prev/next nav, visitor count, and comments section.
- `read-only` Hidden posts remain excluded from public lists and sitemap, but direct hidden-post URLs still behave as intended.
- `read-only` Malformed or missing article routes still produce the expected 404 response.
- `read-only` Mobile navigation, sidebar behavior, and back-to-top affordances remain usable.

### 3. Public Edge Cases

- `read-only` Pagination boundaries: `/page/0/`, negative values, non-numeric values, and out-of-range pages behave consistently.
- `read-only` Archive filters handle exact year and zero-padded month expectations correctly.
- `read-only` Home-page excerpts still split correctly around `<!-- more -->`.
- `read-only` “Read more” behavior still matches the rendered article structure.
- `read-only` Article prev/next navigation is correct for first, last, hidden, and odd date cases.
- `read-only` External markdown links still open in a new tab with safe attributes.
- `read-only` Markdown images still render and include lazy-loading behavior.
- `read-only` Friend-links loader still handles success, failure, malformed lines, blank lines, and escaped hostile text safely.
- `read-only` Comment UI still handles empty state, load failure, submit failure, escaping, and relative-time display.

### 4. API And Data Capture Checks

- `read-only` Visitors API returns counts for single-slug and multi-slug requests.
- `stateful` Visitors POST still increments counts and normalizes slugs to `/slug/` form.
- `read-only` Visitor slug-list handling still deduplicates repeated slugs.
- `read-only` Comments API still returns comment lists for a valid slug and returns an error for missing core parameters.
- `stateful` Comment creation still works with the current public payload shape.
- `read-only` Comment length limit still rejects oversized content.
- `read-only` Public comments still show optional IP and location metadata only when present.
- `read-only` IP capture and Cloudflare-derived location fields still map through to storage and public/admin rendering.
- `read-only` D1 init remains idempotent and comment-table migrations still tolerate older schemas.

### 5. Admin Authentication And Dashboard

- `read-only` `/admin` still renders the login form for unauthenticated users.
- `secrets-required` `stateful` Correct admin password still logs in successfully.
- `read-only` Wrong password still shows the expected inline error.
- `read-only` Protected admin routes still redirect unauthenticated requests back to `/admin`.
- `secrets-required` `stateful` Logout still clears the admin cookie and returns the logged-out notice.
- `read-only` Admin cookie flags remain correct for path, `HttpOnly`, `SameSite=Strict`, max age, and HTTPS-secure handling.
- `read-only` Dashboard still lists articles and recent comments correctly.
- `read-only` Dashboard still behaves correctly in GitHub-backed mode versus fallback bundled-data mode.
- `read-only` Recent comments still support schema aliases for IP and location columns and still cap at 25 newest entries.

### 6. Admin Comment Moderation

- `secrets-required` `stateful` Comment delete still removes an existing recent comment.
- `read-only` Invalid comment IDs still map to the expected error state.
- `read-only` Missing comment rows still map to the expected not-found state.
- `read-only` Comment delete failures still map to the generic failure notice instead of leaking internals.
- `read-only` Dashboard comment rows still escape user-controlled content such as nickname, email, content, IP, and location.

### 7. Admin Article Editor

- `secrets-required` `read-only` New-article page still loads only when GitHub editing is configured.
- `read-only` Blank editor defaults still include current Shanghai-local timestamp, unchecked hidden flag, blank markdown body, and no delete button.
- `read-only` Edit route still handles missing or invalid `path` values with the expected redirect.
- `read-only` Validation still requires title, published date, slug, and markdown body.
- `read-only` Slug normalization still trims surrounding slashes only.
- `read-only` Tag normalization still trims and deduplicates tags.
- `read-only` Datetime parsing still forces `+08:00` output and should be checked for malformed non-browser submissions.
- `read-only` EasyMDE still loads on editor pages, opens split preview automatically, syncs markdown back into the textarea, and falls back cleanly if the editor script is unavailable.
- `read-only` Live markdown preview still reflects edits accurately enough for headings, lists, code blocks, links, and images.

### 8. Admin Article CRUD And GitHub

- `secrets-required` `stateful` Creating a GitHub-backed article still writes a markdown file and redirects to edit mode.
- `secrets-required` `stateful` Editing an article still updates the file contents and hidden flag correctly.
- `secrets-required` `stateful` Deleting an article still removes the GitHub file and returns to the dashboard.
- `read-only` File path selection still comes from the slug tail, remains flat under `content/posts/`, and resolves collisions with numeric suffixes.
- `read-only` Editing a slug still changes front matter but does not rename the existing file path.
- `read-only` Saved article `updated` timestamps still refresh on save.
- `read-only` Admin-created slugs should still be checked for public routability, because persistence does not guarantee they match the public `/:year/:month/:day/:category/:slug/` route shape.
- `read-only` GitHub API failures still surface correctly: save failures render the editor with an error, while load/delete failures redirect through the dashboard error flow.
- `read-only` GitHub content parsing still tolerates only valid flat `content/posts/*.md` files and strict front matter shape.

### 9. Deploy And Logout Flow

- `secrets-required` `stateful` Deploy button from dashboard still triggers the Cloudflare deploy hook when configured.
- `secrets-required` `stateful` Deploy button from article editor still returns to the correct editor URL when `path` is present.
- `read-only` `returnTo` sanitization still only allows `/admin...` destinations.
- `read-only` Missing, invalid, non-HTTPS, network-failed, or non-2xx deploy-hook configurations still map to the expected generic user-facing errors.
- `read-only` Saving or deleting an article must not trigger deploy automatically; deploy remains explicit.

### 10. Build And Helper Invariants

- `read-only` `scripts/build-articles.ts` still scans all markdown posts and generates the expected `ArticleData` shape.
- `read-only` Build output ordering still sorts by descending date string.
- `read-only` Parse failures in article files are still visible and should not silently hide important content changes.
- `read-only` Generated article data still has expected totals, hidden-post count, unique slugs, and route-compatible slugs.
- `read-only` `parseArticleFile()` and `serializeArticleFile()` should be checked for round-trip stability, especially around quoted strings, escaped characters, CRLF input, and tag parsing.
- `read-only` `getAdjacentArticles()` should be checked for unknown-date and hidden-post edge cases.
- `read-only` Hidden article policy should remain consistent across lists, tag pages, sitemap generation, and direct lookup.

### 11. SEO And Static Assets

- `read-only` Homepage metadata still includes canonical, OG, and Twitter title/description basics.
- `read-only` Article pages still emit article-specific canonical and OG URL metadata.
- `read-only` Check whether route-specific canonical and OG URLs are still correct for archives, tags, and paginated home pages.
- `read-only` Confirm article cover metadata still behaves as intended if `cover` is present.
- `read-only` `/sitemap.xml`, `/baidusitemap.xml`, and `/robots.txt` still return correct content types and expected URL inventory.
- `read-only` Hidden posts must remain excluded from sitemap output.
- `read-only` Static verification files and icon assets referenced by the layout must remain reachable.

## Coverage Map

### Already Covered By Current Playwright

- Homepage chrome, page 1/page 2 ordering, archives, tag pages, and basic navigation.
- Article-route smoke coverage for all generated articles.
- Visitor API basics and visitor-count UI.
- Comment API basics, UI submission, and optional public IP/location rendering.
- Friend-links success and failure rendering.
- Basic SEO smoke for homepage, article canonical metadata, sitemap, and robots.
- Admin login smoke, dashboard article visibility checks, recent-comment deletion flow, and optional GitHub-backed article CRUD flow.

### Still Manual Or Missing

- Pagination boundary behavior and malformed archive filters.
- Public 404 behavior for bad article paths.
- Excerpt and `Read more` anchor correctness.
- Mobile menu toggle, sidebar tab switching, and back-to-top interaction.
- Friend-link parser edge cases and comment load/submit failure branches.
- D1 migration/idempotence checks outside browser E2E.
- Admin cookie attribute checks and protected-route redirect matrix.
- GitHub content parser, file-path collision logic, and front matter round-trip stability.
- Deploy-hook sanitization and detailed error-path coverage.
- Build drift, generated article invariants, and `getAdjacentArticles()` edge cases.

## Notes

- Prefer fast unit or integration tests for helpers in `src/lib/article-files.ts`, `src/lib/articles.ts`, `src/lib/markdown.ts`, and `scripts/build-articles.ts`.
- Keep browser E2E slim and use it mainly for route rendering, public UI wiring, and the highest-value admin flows.
- If a change only touches one subsystem, you can run the relevant section first, but finish with at least the baseline build check and public smoke checks.
