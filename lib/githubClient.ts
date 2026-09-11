// Replaces lib/supabaseClient.ts. Content lives in two GitHub repos:
//  - pfalexns-posts (public)  — published posts + images, read via jsDelivr
//  - pfalexns-drafts (private) — draft posts + images, read/write only with the PAT
// Writes to both go through GitHub's Contents API using a PAT unlocked from
// an encrypted vault (see unlockWithPassphrase) rather than pasted per device.

const POSTS_REPO = { owner: "alexisnsns", repo: "pfalexns-posts" };
const DRAFTS_REPO = { owner: "alexisnsns", repo: "pfalexns-drafts" };
const BRANCH = "main";

const JSDELIVR_BASE = "https://cdn.jsdelivr.net/gh";
const GITHUB_API = "https://api.github.com";
const JSDELIVR_PURGE = "https://purge.jsdelivr.net/gh";

const PAT_STORAGE_KEY = "pfalexns_pat";

export type Post = {
  slug: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
};

type IndexEntry = Pick<Post, "slug" | "title" | "created_at" | "tags"> & { excerpt: string };

function excerptOf(content: string): string {
  return content.length > 200 ? content.slice(0, 200) + "..." : content;
}

// ---------------------------------------------------------------------------
// PAT session storage (per browser/device — see vault unlock below)
// ---------------------------------------------------------------------------

export function getStoredPat(): string | null {
  try {
    return localStorage.getItem(PAT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storePat(pat: string) {
  try {
    localStorage.setItem(PAT_STORAGE_KEY, pat);
  } catch {
    // localStorage unavailable (private mode, etc.) — PAT just won't persist
  }
  window.dispatchEvent(new Event("pfalexns-pat-changed"));
}

export function clearPat() {
  try {
    localStorage.removeItem(PAT_STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("pfalexns-pat-changed"));
}

// ---------------------------------------------------------------------------
// Vault: PAT is encrypted once and committed to pfalexns-posts/.auth/vault.json
// (public — ciphertext is safe to publish). Any device decrypts it locally
// with the passphrase instead of needing the raw PAT pasted in.
// ---------------------------------------------------------------------------

type Vault = { salt: string; iv: string; ciphertext: string; iterations: number };

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/** Fetches the vault, decrypts it with `passphrase`, stores the PAT for this device. */
export async function unlockWithPassphrase(passphrase: string): Promise<void> {
  const res = await fetch(
    `${JSDELIVR_BASE}/${POSTS_REPO.owner}/${POSTS_REPO.repo}@${BRANCH}/.auth/vault.json`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Could not reach the vault. Try again shortly.");
  const vault: Vault = await res.json();

  const salt = b64ToBytes(vault.salt);
  const iv = b64ToBytes(vault.iv);
  const ciphertext = b64ToBytes(vault.ciphertext);
  const key = await deriveKey(passphrase, salt, vault.iterations);

  let decrypted: ArrayBuffer;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );
  } catch {
    throw new Error("Wrong passphrase.");
  }

  storePat(new TextDecoder().decode(decrypted));
}

// ---------------------------------------------------------------------------
// Reads — public posts via jsDelivr (fast, cached, no auth, no rate limit
// concerns). Drafts via the authenticated GitHub API (private repo).
// ---------------------------------------------------------------------------

async function jsdelivrJson<T>(path: string): Promise<T | null> {
  const res = await fetch(
    `${JSDELIVR_BASE}/${POSTS_REPO.owner}/${POSTS_REPO.repo}@${BRANCH}/${path}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPublishedIndex(): Promise<IndexEntry[]> {
  return (await jsdelivrJson<IndexEntry[]>("posts/index.json")) ?? [];
}

export async function fetchPublishedPost(slug: string): Promise<Post | null> {
  return jsdelivrJson<Post>(`posts/${encodeURIComponent(slug)}.json`);
}

async function draftsGet(path: string, pat: string): Promise<Response> {
  return fetch(
    `${GITHUB_API}/repos/${DRAFTS_REPO.owner}/${DRAFTS_REPO.repo}/contents/${path}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `token ${pat}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    },
  );
}

function decodeContentsFile(json: { content: string }): string {
  return decodeURIComponent(escape(atob(json.content.replace(/\n/g, ""))));
}

export async function fetchDraftIndex(pat: string): Promise<IndexEntry[]> {
  const res = await draftsGet("posts/index.json", pat);
  if (!res.ok) return [];
  return JSON.parse(decodeContentsFile(await res.json()));
}

export async function fetchDraftPost(slug: string, pat: string): Promise<Post | null> {
  const res = await draftsGet(`posts/${encodeURIComponent(slug)}.json`, pat);
  if (!res.ok) return null;
  return JSON.parse(decodeContentsFile(await res.json()));
}

// ---------------------------------------------------------------------------
// Writes — GitHub Contents API, called directly from the browser (CORS is
// supported for all verbs, including PUT/DELETE). Single-admin, so no
// concurrency handling beyond re-fetching the current sha before each write.
// ---------------------------------------------------------------------------

type RepoRef = { owner: string; repo: string };

function encodeContent(contentObj: unknown): string {
  const str = typeof contentObj === "string" ? contentObj : JSON.stringify(contentObj, null, 2);
  return btoa(unescape(encodeURIComponent(str)));
}

async function getSha(target: RepoRef, path: string, pat: string): Promise<string | undefined> {
  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `token ${pat}` } },
  );
  if (!res.ok) return undefined;
  const json = await res.json();
  return json.sha as string;
}

async function putFile(
  target: RepoRef,
  path: string,
  contentObj: unknown,
  message: string,
  pat: string,
): Promise<void> {
  const sha = await getSha(target, path, pat);
  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: encodeContent(contentObj),
        sha,
        branch: BRANCH,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  }
}

async function deleteFile(
  target: RepoRef,
  path: string,
  message: string,
  pat: string,
): Promise<void> {
  const sha = await getSha(target, path, pat);
  if (!sha) return; // already gone
  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `token ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, sha, branch: BRANCH }),
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub delete failed (${res.status}): ${await res.text()}`);
  }
}

function purgeJsdelivr(path: string): void {
  // Best-effort; failures here shouldn't block the write itself.
  fetch(
    `${JSDELIVR_PURGE}/${POSTS_REPO.owner}/${POSTS_REPO.repo}@${BRANCH}/${path}`,
  ).catch(() => {});
}

async function upsertIndexEntry(target: RepoRef, entry: IndexEntry, pat: string): Promise<void> {
  const sha = await getSha(target, "posts/index.json", pat);
  let index: IndexEntry[] = [];
  if (sha) {
    const res = await fetch(
      `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/posts/index.json?ref=${BRANCH}`,
      { headers: { Authorization: `token ${pat}` } },
    );
    if (res.ok) index = JSON.parse(decodeContentsFile(await res.json()));
  }
  const next = index.filter((p) => p.slug !== entry.slug);
  next.unshift(entry);
  await putFile(target, "posts/index.json", next, `Update index for ${entry.slug}`, pat);
}

async function removeIndexEntry(target: RepoRef, slug: string, pat: string): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/posts/index.json?ref=${BRANCH}`,
    { headers: { Authorization: `token ${pat}` } },
  );
  if (!res.ok) return;
  const index: IndexEntry[] = JSON.parse(decodeContentsFile(await res.json()));
  await putFile(
    target,
    "posts/index.json",
    index.filter((p) => p.slug !== slug),
    `Remove ${slug} from index`,
    pat,
  );
}

/**
 * Images uploaded while composing a draft live in the private repo (see
 * uploadImage) and are referenced via an authenticated Contents API URL that
 * only works with the PAT. Before publishing, any such references need to be
 * re-committed to the public repo and rewritten to a plain jsDelivr URL, or
 * published posts would contain broken/private image links for visitors.
 * (Leftover copies in the drafts repo are not cleaned up — harmless, low
 * priority; images aren't as sensitive as unpublished post text.)
 */
async function migrateDraftImages(content: string, slug: string, pat: string): Promise<string> {
  const draftPrefix = `${GITHUB_API}/repos/${DRAFTS_REPO.owner}/${DRAFTS_REPO.repo}/contents/`;
  const pattern = new RegExp(
    `${draftPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^)\\s]+)\\?ref=${BRANCH}`,
    "g",
  );
  const matches = [...content.matchAll(pattern)];
  if (!matches.length) return content;

  let updated = content;
  for (const match of matches) {
    const path = decodeURIComponent(match[1]);
    const res = await fetch(`${draftPrefix}${match[1]}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${pat}` },
    });
    if (!res.ok) continue;
    const json = await res.json();
    const newPath = path.startsWith("images/") ? `images/${slug}/${path.split("/").pop()}` : path;
    await fetch(`${GITHUB_API}/repos/${POSTS_REPO.owner}/${POSTS_REPO.repo}/contents/${newPath}`, {
      method: "PUT",
      headers: { Authorization: `token ${pat}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Publish image for ${slug}`,
        content: json.content.replace(/\n/g, ""),
        branch: BRANCH,
      }),
    });
    purgeJsdelivr(newPath);
    const publicUrl = `${JSDELIVR_BASE}/${POSTS_REPO.owner}/${POSTS_REPO.repo}@${BRANCH}/${newPath}`;
    updated = updated.split(match[0]).join(publicUrl);
  }
  return updated;
}

function toIndexEntry(post: Post): IndexEntry {
  const { slug, title, created_at, tags, content } = post;
  return { slug, title, created_at, tags, excerpt: excerptOf(content) };
}

/** Saves a draft (create or update) in pfalexns-drafts. */
export async function saveDraft(post: Post, pat: string): Promise<void> {
  await putFile(DRAFTS_REPO, `posts/${post.slug}.json`, post, `Save draft: ${post.title}`, pat);
  await upsertIndexEntry(DRAFTS_REPO, toIndexEntry(post), pat);
}

/**
 * Publishes a post: writes it to pfalexns-posts, purges the CDN cache for
 * it, then removes it from pfalexns-drafts if it was there.
 */
export async function publishPost(postIn: Post, pat: string): Promise<void> {
  const post = { ...postIn, content: await migrateDraftImages(postIn.content, postIn.slug, pat) };
  await putFile(POSTS_REPO, `posts/${post.slug}.json`, post, `Publish: ${post.title}`, pat);
  await upsertIndexEntry(POSTS_REPO, toIndexEntry(post), pat);
  purgeJsdelivr(`posts/${post.slug}.json`);
  purgeJsdelivr("posts/index.json");

  const draftSha = await getSha(DRAFTS_REPO, `posts/${post.slug}.json`, pat);
  if (draftSha) {
    await deleteFile(DRAFTS_REPO, `posts/${post.slug}.json`, `Publish ${post.slug}`, pat);
    await removeIndexEntry(DRAFTS_REPO, post.slug, pat);
  }
}

export async function deletePost(slug: string, isDraft: boolean, pat: string): Promise<void> {
  const target = isDraft ? DRAFTS_REPO : POSTS_REPO;
  await deleteFile(target, `posts/${slug}.json`, `Delete ${slug}`, pat);
  await removeIndexEntry(target, slug, pat);
  if (!isDraft) {
    purgeJsdelivr(`posts/${slug}.json`);
    purgeJsdelivr("posts/index.json");
  }
}

/** Uploads an image (as base64) and returns its public/authenticated URL. */
export async function uploadImage(
  file: File,
  slug: string,
  isDraft: boolean,
  pat: string,
): Promise<string> {
  const target = isDraft ? DRAFTS_REPO : POSTS_REPO;
  const path = `images/${slug}/${Date.now()}-${file.name}`;

  const buffer = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const res = await fetch(
    `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${pat}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: `Upload image for ${slug}`, content: b64, branch: BRANCH }),
    },
  );
  if (!res.ok) throw new Error(`Image upload failed (${res.status}): ${await res.text()}`);

  if (isDraft) {
    // Private repo — no public CDN URL until published; return an API URL
    // the editor can resolve with the PAT (not renderable directly in <img>
    // without auth, but keeps the reference correct until publish rewrites it).
    return `${GITHUB_API}/repos/${target.owner}/${target.repo}/contents/${path}?ref=${BRANCH}`;
  }
  purgeJsdelivr(path);
  return `${JSDELIVR_BASE}/${target.owner}/${target.repo}@${BRANCH}/${path}`;
}

export function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || `post-${Date.now().toString(36)}`;
}
