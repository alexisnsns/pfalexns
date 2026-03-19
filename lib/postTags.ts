import type { SupabaseClient } from "@supabase/supabase-js";

export type Tag = {
  id: number;
  name: string;
  slug: string;
};

type PostTagJoinRow = { tags?: Tag | null; tag?: Tag | null };

export type PostWithTagsRow = {
  post_tags?: PostTagJoinRow[] | null;
};

export function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || `tag-${Math.random().toString(36).slice(2, 10)}`;
}

/** Comma-separated tag names → trimmed unique display names (order preserved). */
export function parseTagInput(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of input.split(",")) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function extractTags(post: PostWithTagsRow): Tag[] {
  const pts = post.post_tags;
  if (!pts?.length) return [];
  const out: Tag[] = [];
  for (const pt of pts) {
    const t = pt.tags ?? pt.tag;
    if (t) out.push(t);
  }
  return out;
}

/**
 * Ensures each name has a row in `tags` (match/create by slug). Returns tag ids in the same order as names.
 */
export async function ensureTagIds(
  supabase: SupabaseClient,
  rawNames: string[]
): Promise<number[]> {
  const names = rawNames.map((n) => n.trim()).filter(Boolean);
  const bySlugFirstName = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    if (!bySlugFirstName.has(slug)) bySlugFirstName.set(slug, name);
  }
  const pairs = [...bySlugFirstName.entries()].map(([slug, name]) => ({
    slug,
    name,
  }));

  if (!pairs.length) return [];

  const slugs = pairs.map((p) => p.slug);
  const { data: existing, error: selErr } = await supabase
    .from("tags")
    .select("id, slug")
    .in("slug", slugs);

  if (selErr) throw selErr;

  const bySlug = new Map(
    (existing ?? []).map((t: { id: number; slug: string }) => [t.slug, t.id])
  );

  for (const { slug, name } of pairs) {
    if (bySlug.has(slug)) continue;
    const { data, error } = await supabase
      .from("tags")
      .insert({ name, slug })
      .select("id")
      .single();

    if (error) {
      const { data: row } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (row?.id != null) bySlug.set(slug, row.id);
    } else if (data?.id != null) {
      bySlug.set(slug, data.id);
    }
  }

  return pairs.map((p) => bySlug.get(p.slug)).filter((id): id is number => id != null);
}

export async function linkTagsToPost(
  supabase: SupabaseClient,
  postId: number,
  tagIds: number[]
): Promise<void> {
  if (!tagIds.length) return;
  const rows = tagIds.map((tag_id) => ({ post_id: postId, tag_id }));
  const { error } = await supabase.from("post_tags").insert(rows);
  if (error && error.code !== "23505") throw error;
}

/** Use in `.select(POST_SELECT_WITH_TAGS)` for posts + nested tags. */
export const POST_SELECT_WITH_TAGS = `
*,
post_tags (
  tags (
    id,
    name,
    slug
  )
)
`;
