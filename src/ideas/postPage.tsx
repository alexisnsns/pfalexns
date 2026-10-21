import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";
import {
  fetchPublishedPost,
  fetchDraftPost,
  getStoredPat,
  saveDraft,
  publishPost,
  deletePost,
  uploadImage,
  type Post,
} from "../../lib/githubClient";
import { parseTagInput } from "../../lib/postTags";
import Spinner from "./Spinner";
import MarkdownImage from "./MarkdownImage";

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const pat = getStoredPat();

  const [post, setPost] = useState<Post | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  // which slow GitHub write is in flight, so buttons can show progress
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      const published = await fetchPublishedPost(slug);
      if (published) {
        setPost(published);
        setIsDraft(false);
      } else if (pat) {
        const draft = await fetchDraftPost(slug, pat);
        setPost(draft);
        setIsDraft(true);
      } else {
        setPost(null);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleAddTags() {
    if (!pat || !post) return;
    const names = parseTagInput(newTagInput);
    if (!names.length) return;
    setBusy("tags");
    try {
      const next = { ...post, tags: [...new Set([...post.tags, ...names])] };
      if (isDraft) await saveDraft(next, pat);
      else await publishPost(next, pat);
      setPost(next);
      setNewTagInput("");
    } catch (e) {
      console.error(e);
      alert("Could not add tags.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemoveTag(tag: string) {
    if (!pat || !post) return;
    setBusy("tags");
    try {
      const next = { ...post, tags: post.tags.filter((t) => t !== tag) };
      if (isDraft) await saveDraft(next, pat);
      else await publishPost(next, pat);
      setPost(next);
    } catch (e) {
      console.error(e);
      alert("Could not remove tag.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!pat || !post) return alert("Not authorized.");
    if (!window.confirm("Delete this post?")) return;
    setBusy("delete");
    try {
      await deletePost(post.slug, isDraft, pat);
      navigate("/Ideas");
    } catch (e) {
      console.error(e);
      alert("Could not delete post.");
      setBusy(null);
    }
  }

  async function saveEdit(publish: boolean) {
    if (!pat || !post) return alert("Not authorized.");
    const next: Post = { ...post, title: editTitle, content: editContent };
    setBusy(publish ? "publish" : "draft");
    try {
      if (publish) {
        await publishPost(next, pat);
        setIsDraft(false);
      } else {
        await saveDraft(next, pat);
        setIsDraft(true);
      }
      setPost(next);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Could not save changes.");
    } finally {
      setBusy(null);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file || !pat || !post) return;
      setBusy("image");
      const imageUrl = await uploadImage(file, post.slug, isDraft, pat);
      setEditContent((prev) => `${prev}\n\n![image](${imageUrl})`);
    } catch (err) {
      console.error(err);
      alert("❌ Image upload failed");
    } finally {
      setBusy(null);
      event.target.value = "";
    }
  }

  if (loading) return <Spinner label="Loading post" page />;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="ideas-container">
      <Link style={styles.link} to="/Ideas">
        ← Back to Ideas
      </Link>

      {isEditing ? (
        <>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="edit-input"
          />

          <MDEditor
            previewOptions={{ components: { img: MarkdownImage } }}
            data-color-mode="light"
            value={editContent}
            onChange={(val) => setEditContent(val ?? "")}
            height={300}
          />

          <div className="edit-buttons">
            <label className="upload-button">
              {busy === "image" ? "Uploading..." : "📸 Upload Image"}
              <input
                type="file"
                accept="image/*"
                disabled={!!busy}
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </label>

            <button disabled={!!busy} onClick={() => saveEdit(true)}>
              {busy === "publish" ? "Publishing..." : "Publish"}
            </button>
            <button disabled={!!busy} onClick={() => saveEdit(false)}>
              {busy === "draft" ? "Saving..." : "Save Draft"}
            </button>
            <button disabled={!!busy} onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>{post.title}</h1>
          {isDraft && <span className="draft-tag">[Draft]</span>}
          <p>{new Date(post.created_at).toLocaleDateString()}</p>
          {post.tags.length > 0 && (
            <div className="post-tags post-tags--detail" aria-label="Tags">
              {post.tags.map((t) => (
                <span key={t} className="tag-pill">
                  {t}
                  {pat && (
                    <button
                      type="button"
                      className="tag-pill-remove"
                      disabled={!!busy}
                      onClick={() => handleRemoveTag(t)}
                      aria-label={`Remove tag ${t}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="post-content markdown-body">
            <ReactMarkdown components={{ img: MarkdownImage }}>{post.content}</ReactMarkdown>
          </div>
        </>
      )}

      {pat && !isEditing && (
        <div className="post-admin-footer">
          <div className="tag-editor">
            <input
              type="text"
              className="tag-editor-input"
              placeholder="Add tags (comma-separated)"
              value={newTagInput}
              disabled={!!busy}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTags();
                }
              }}
            />
            <button type="button" disabled={!!busy || !newTagInput.trim()} onClick={handleAddTags}>
              {busy === "tags" ? "Saving..." : "Add tags"}
            </button>
          </div>
          <div className="post-actions">
            <button
              disabled={!!busy}
              onClick={() => {
                setEditTitle(post.title);
                setEditContent(post.content);
                setIsEditing(true);
              }}
            >
              Edit
            </button>
            <button disabled={!!busy} onClick={handleDelete}>
              {busy === "delete" ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
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
