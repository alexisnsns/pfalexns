import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Ideas.css";
import type { User } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";
import {
  extractTags,
  type PostWithTagsRow,
  POST_SELECT_WITH_TAGS,
  type Tag,
} from "../../lib/postTags";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  draft: boolean;
} & PostWithTagsRow;

type IdeasFilter = "published" | "drafts";

export default function Ideas() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [ideasFilter, setIdeasFilter] = useState<IdeasFilter>("published");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);

  // --- Get current user
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ?? null);
    }
    getUser();
  }, []);

  // --- Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT_WITH_TAGS)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setPosts((data ?? []) as Post[]);
      setLoading(false);
    }

    fetchPosts();
  }, [user]);

  const draftFilteredPosts = useMemo(() => {
    if (!user) return posts.filter((p) => !p.draft);
    if (ideasFilter === "published") return posts.filter((p) => !p.draft);
    return posts.filter((p) => p.draft);
  }, [posts, user, ideasFilter]);

  const availableTags = useMemo(() => {
    const bySlug = new Map<string, Tag>();
    for (const p of draftFilteredPosts) {
      for (const t of extractTags(p)) {
        if (!bySlug.has(t.slug)) bySlug.set(t.slug, t);
      }
    }
    return [...bySlug.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [draftFilteredPosts]);

  const availableSlugSet = useMemo(
    () => new Set(availableTags.map((t) => t.slug)),
    [availableTags],
  );

  const selectedSlugSet = useMemo(() => {
    const next = new Set<string>();
    for (const s of selectedTagSlugs) {
      if (availableSlugSet.has(s)) next.add(s);
    }
    return next;
  }, [selectedTagSlugs, availableSlugSet]);

  const visiblePosts = useMemo(() => {
    if (selectedSlugSet.size === 0) return draftFilteredPosts;
    return draftFilteredPosts.filter((p) =>
      extractTags(p).some((t) => selectedSlugSet.has(t.slug)),
    );
  }, [draftFilteredPosts, selectedSlugSet]);

  function toggleTagFilter(slug: string) {
    setSelectedTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Ideas</h1>

      <div className="ideas-nav">
        <div className="links">
          <Link to="/" style={styles.link}>
            /Main
          </Link>
        </div>

        {user ? (
          <div className="user-info">
            <span>{user.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              Logout
            </button>
            <Link to="/Write" style={styles.link}>
              /Write
            </Link>
          </div>
        ) : (
          <Link to="/Login" style={styles.link}>
            /Login
          </Link>
        )}
      </div>

      {user && (
        <div className="ideas-filter" role="group" aria-label="Show posts">
          <button
            type="button"
            className={
              ideasFilter === "published"
                ? "ideas-filter-btn ideas-filter-btn--active"
                : "ideas-filter-btn"
            }
            onClick={() => setIdeasFilter("published")}
          >
            Published
          </button>
          <button
            type="button"
            className={
              ideasFilter === "drafts"
                ? "ideas-filter-btn ideas-filter-btn--active"
                : "ideas-filter-btn"
            }
            onClick={() => setIdeasFilter("drafts")}
          >
            Drafts
          </button>
        </div>
      )}

      {!loading && availableTags.length > 0 && (
        <div className="ideas-tag-filter" aria-label="Filter by tag">
          <span className="ideas-tag-filter-label">Tags</span>
          <div className="ideas-tag-filter-chips" role="group">
            {availableTags.map((t) => {
              const selected = selectedSlugSet.has(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  className={
                    selected
                      ? "ideas-tag-filter-chip ideas-tag-filter-chip--selected"
                      : "ideas-tag-filter-chip"
                  }
                  aria-pressed={selected}
                  onClick={() => toggleTagFilter(t.slug)}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && <Spinner label="Loading posts" />}

      <div className="posts-list">
        {visiblePosts.map((post) => {
          const tags = extractTags(post);
          return (
            <article key={post.id} className="post-item">
              <Link
                to={`/Ideas/${post.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <h2 className="post-title">
                  {post.title}{" "}
                  {post.draft && <span className="draft-tag">[Draft]</span>}
                </h2>

                {tags.length > 0 && (
                  <div className="post-tags" aria-label="Tags">
                    {tags.map((t) => (
                      <span key={t.id} className="tag-pill">
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="post-content markdown-body">
                  <ReactMarkdown>
                    {post.content.length > 200
                      ? post.content.slice(0, 200) + "..."
                      : post.content}
                  </ReactMarkdown>
                </div>

                <p className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </Link>
            </article>
          );
        })}
      </div>

      {!loading && visiblePosts.length === 0 && (
        <p>
          {selectedSlugSet.size > 0 && draftFilteredPosts.length > 0
            ? "No posts match the selected tags."
            : !user
              ? "No posts yet. Stay tuned!"
              : ideasFilter === "drafts"
                ? "No drafts."
                : "No published posts."}
        </p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  link: {
    color: "#6b7280",
    textDecoration: "none",
    fontWeight: 500,
    transition: "color 0.2s",
    cursor: "pointer",
  },
};
