import { useEffect, useMemo, useState } from "react";
import {
  fetchPublishedIndex,
  fetchDraftIndex,
  getStoredPat,
  clearPat,
  type Post,
} from "../../lib/githubClient";
import "./Ideas.css";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import Spinner from "./Spinner";

type IndexPost = Pick<Post, "slug" | "title" | "created_at" | "tags"> & {
  excerpt: string;
  draft: boolean;
};

type IdeasFilter = "published" | "drafts";

export default function Ideas() {
  const [posts, setPosts] = useState<IndexPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pat, setPat] = useState<string | null>(() => getStoredPat());
  const [ideasFilter, setIdeasFilter] = useState<IdeasFilter>("published");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    function onPatChanged() {
      setPat(getStoredPat());
    }
    window.addEventListener("pfalexns-pat-changed", onPatChanged);
    return () => window.removeEventListener("pfalexns-pat-changed", onPatChanged);
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      const published = (await fetchPublishedIndex()).map((p) => ({ ...p, draft: false }));
      let drafts: IndexPost[] = [];
      if (pat) {
        drafts = (await fetchDraftIndex(pat)).map((p) => ({ ...p, draft: true }));
      }
      setPosts([...published, ...drafts]);
      setLoading(false);
    }
    fetchPosts();
  }, [pat]);

  const draftFilteredPosts = useMemo(() => {
    if (!pat) return posts.filter((p) => !p.draft);
    return posts.filter((p) => (ideasFilter === "published" ? !p.draft : p.draft));
  }, [posts, pat, ideasFilter]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of draftFilteredPosts) for (const t of p.tags) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [draftFilteredPosts]);

  const availableTagSet = useMemo(() => new Set(availableTags), [availableTags]);

  const selectedTagSet = useMemo(() => {
    const next = new Set<string>();
    for (const t of selectedTags) if (availableTagSet.has(t)) next.add(t);
    return next;
  }, [selectedTags, availableTagSet]);

  const visiblePosts = useMemo(() => {
    if (selectedTagSet.size === 0) return draftFilteredPosts;
    return draftFilteredPosts.filter((p) => p.tags.some((t) => selectedTagSet.has(t)));
  }, [draftFilteredPosts, selectedTagSet]);

  function toggleTagFilter(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
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

        {pat ? (
          <div className="user-info">
            <button
              onClick={() => {
                clearPat();
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

      {pat && (
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
              const selected = selectedTagSet.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  className={
                    selected
                      ? "ideas-tag-filter-chip ideas-tag-filter-chip--selected"
                      : "ideas-tag-filter-chip"
                  }
                  aria-pressed={selected}
                  onClick={() => toggleTagFilter(t)}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && <Spinner label="Loading posts" />}

      <div className="posts-list">
        {visiblePosts.map((post) => (
          <article key={post.slug} className="post-item">
            <Link to={`/Ideas/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <h2 className="post-title">
                {post.title} {post.draft && <span className="draft-tag">[Draft]</span>}
              </h2>

              {post.tags.length > 0 && (
                <div className="post-tags" aria-label="Tags">
                  {post.tags.map((t) => (
                    <span key={t} className="tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {post.excerpt && (
                <div className="post-content markdown-body">
                  <ReactMarkdown>{post.excerpt}</ReactMarkdown>
                </div>
              )}

              <p className="post-date">{new Date(post.created_at).toLocaleDateString()}</p>
            </Link>
          </article>
        ))}
      </div>

      {!loading && visiblePosts.length === 0 && (
        <p>
          {selectedTagSet.size > 0 && draftFilteredPosts.length > 0
            ? "No posts match the selected tags."
            : !pat
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
