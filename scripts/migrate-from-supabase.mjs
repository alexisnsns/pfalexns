#!/usr/bin/env node
// Run this locally: node scripts/migrate-from-supabase.mjs [--apply]
//
// Reads all posts (with tags) from Supabase and writes them into
// pfalexns-posts (published) / pfalexns-drafts (draft) as slug.json files +
// index.json entries, matching the shape lib/githubClient.ts expects.
// Also re-uploads each post's images from the Supabase `blogposts` bucket.
//
// Without --apply this only prints what it *would* do — nothing is written
// to GitHub. Run it once without --apply and read the output before
// re-running with --apply.
//
// Required env vars (set these in your own shell, not committed anywhere):
//   SUPABASE_URL                — same value the old app used
//   SUPABASE_SERVICE_ROLE_KEY   — Project Settings → API → service_role secret.
//     RLS on `posts` blocks anonymous/anon-key reads of draft rows (confirmed
//     — the public anon key alone only returns published posts), so this uses
//     the service role key instead, which bypasses RLS entirely. Treat it as
//     sensitive (full DB access) but it's fine for a single local run.
//   GITHUB_PAT                  — the fine-grained PAT for the 2 content repos
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GITHUB_PAT=... node scripts/migrate-from-supabase.mjs

const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_PAT = process.env.GITHUB_PAT;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (APPLY && !GITHUB_PAT) {
  console.error("Set GITHUB_PAT to actually write (--apply).");
  process.exit(1);
}

const POSTS_REPO = { owner: "alexisnsns", repo: "pfalexns-posts" };
const DRAFTS_REPO = { owner: "alexisnsns", repo: "pfalexns-drafts" };
const GITHUB_API = "https://api.github.com";

function slugify(title) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || `post-${Date.now().toString(36)}`;
}

async function fetchPosts() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=*,post_tags(tags(id,name,slug))&order=created_at.asc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function githubGetSha(target, path) {
  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}`,
    { headers: { Authorization: `token ${GITHUB_PAT}` } },
  );
  if (!res.ok) return undefined;
  return (await res.json()).sha;
}

async function githubPutFile(target, path, contentBuffer, message) {
  if (!APPLY) {
    console.log(`  [dry-run] would write ${target.repo}/${path} (${contentBuffer.length} bytes)`);
    return;
  }
  const sha = await githubGetSha(target, path);
  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: { Authorization: `token ${GITHUB_PAT}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message, content: contentBuffer.toString("base64"), sha, branch: "main" }),
    },
  );
  if (!res.ok) throw new Error(`GitHub write failed for ${path}: ${res.status} ${await res.text()}`);
}

function excerptOf(content) {
  return content.length > 200 ? content.slice(0, 200) + "..." : content;
}

async function main() {
  console.log(APPLY ? "Running for real — will write to GitHub.\n" : "Dry run — nothing will be written. Pass --apply to actually migrate.\n");

  const rows = await fetchPosts();
  console.log(`Found ${rows.length} post(s) in Supabase.\n`);

  const usedSlugs = new Set();
  const publishedIndex = [];
  const draftIndex = [];

  for (const row of rows) {
    let slug = slugify(row.title);
    while (usedSlugs.has(slug)) slug = `${slug}-${row.id}`;
    usedSlugs.add(slug);

    const tags = (row.post_tags ?? []).map((pt) => pt.tags?.name).filter(Boolean);
    let content = row.content;

    // Rewrite any Supabase Storage image URLs found in the content by
    // downloading + re-uploading them to the target content repo.
    const storageUrlPattern = new RegExp(
      `${SUPABASE_URL}/storage/v1/object/public/blogposts/([^)\\s]+)`,
      "g",
    );
    const target = row.draft ? DRAFTS_REPO : POSTS_REPO;
    for (const match of [...content.matchAll(storageUrlPattern)]) {
      const [fullUrl, filePath] = match;
      const bytes = await downloadImage(fullUrl);
      if (!bytes) {
        console.warn(`  ! could not download image ${fullUrl}, leaving URL as-is`);
        continue;
      }
      const newPath = `images/${slug}/${filePath.split("/").pop()}`;
      await githubPutFile(target, newPath, bytes, `Migrate image for ${slug}`);
      const newUrl = row.draft
        ? `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${newPath}?ref=main`
        : `https://cdn.jsdelivr.net/gh/${target.owner}/${target.repo}@main/${newPath}`;
      content = content.split(fullUrl).join(newUrl);
    }

    const post = {
      slug,
      title: row.title,
      content,
      created_at: row.created_at,
      tags,
    };

    console.log(`- ${row.draft ? "[draft]  " : "[publish]"} ${row.title}  →  ${slug}`);
    await githubPutFile(target, `posts/${slug}.json`, Buffer.from(JSON.stringify(post, null, 2)), `Migrate: ${row.title}`);

    const indexEntry = { slug, title: row.title, created_at: row.created_at, tags, excerpt: excerptOf(content) };
    (row.draft ? draftIndex : publishedIndex).push(indexEntry);
  }

  await githubPutFile(POSTS_REPO, "posts/index.json", Buffer.from(JSON.stringify(publishedIndex, null, 2)), "Migrate published index");
  await githubPutFile(DRAFTS_REPO, "posts/index.json", Buffer.from(JSON.stringify(draftIndex, null, 2)), "Migrate draft index");

  console.log(`\n${publishedIndex.length} published, ${draftIndex.length} draft(s).`);
  if (!APPLY) console.log("Re-run with --apply to actually write these.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
