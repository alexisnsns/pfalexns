import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";
import type { User } from "@supabase/supabase-js";
import {
  extractTags,
  ensureTagIds,
  parseTagInput,
  POST_SELECT_WITH_TAGS,
  type PostWithTagsRow,
} from "../../lib/postTags";
import Spinner from "./Spinner";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  draft: boolean;
} & PostWithTagsRow;

const ADMIN_ID = "e0290332-fb6c-4c3b-937f-283095e3a008";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [tagBusy, setTagBusy] = useState(false);

  // --- Fetch current user
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    }
    getUser();
  }, []);

  // --- Fetch post
  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT_WITH_TAGS)
        .eq("id", id)
        .single();

      if (error) console.error(error);
      else setPost(data);

      setLoading(false);
    }

    fetchPost();
  }, [id]);

  async function refetchPost() {
    if (!id) return;
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT_WITH_TAGS)
      .eq("id", id)
      .single();
    if (!error && data) setPost(data as Post);
  }

  async function handleAddTags() {
    if (!user || user.id !== ADMIN_ID || !post) return;
    const names = parseTagInput(newTagInput);
    if (!names.length) return;
    setTagBusy(true);
    try {
      const ids = await ensureTagIds(supabase, names);
      const rows = ids.map((tag_id) => ({ post_id: post.id, tag_id }));
      const { error } = await supabase.from("post_tags").insert(rows);
      if (error && error.code !== "23505") throw error;
      setNewTagInput("");
      await refetchPost();
    } catch (e) {
      console.error(e);
      alert("Could not add tags. Check RLS policies and the console.");
    } finally {
      setTagBusy(false);
    }
  }

  async function handleRemoveTag(tagId: number) {
    if (!user || user.id !== ADMIN_ID || !post) return;
    setTagBusy(true);
    try {
      const { error } = await supabase
        .from("post_tags")
        .delete()
        .eq("post_id", post.id)
        .eq("tag_id", tagId);
      if (error) throw error;
      await refetchPost();
    } catch (e) {
      console.error(e);
      alert("Could not remove tag.");
    } finally {
      setTagBusy(false);
    }
  }

  // --- Delete post
  async function handleDelete() {
    if (!user || user.id !== ADMIN_ID) return alert("Not authorized.");
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", post?.id);
    if (error) console.error(error);
    else navigate("/Ideas");
  }

  // --- Save edited post
  async function saveEdit(draftValue: boolean) {
    if (!user || user.id !== ADMIN_ID) return alert("Not authorized.");

    const { error } = await supabase
      .from("posts")
      .update({
        title: editTitle,
        content: editContent,
        draft: draftValue,
      })
      .eq("id", post?.id);

    if (error) console.error(error);
    else {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              content: editContent,
              draft: draftValue,
            }
          : prev
      );
      setIsEditing(false);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("blogposts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("blogposts")
        .getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      setEditContent((prev) => `${prev}\n\n![image](${imageUrl})`);
    } catch (err) {
      console.error(err);
      alert("❌ Image upload failed");
    }
  }

  if (loading) return <Spinner label="Loading post" page />;
  if (!post) return <p>Post not found.</p>;

  const postTags = extractTags(post);

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
            data-color-mode="light"
            value={editContent}
            onChange={(val) => setEditContent(val ?? "")}
            height={300}
          />

          <div className="edit-buttons">
            <label className="upload-button">
              📸 Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </label>

            <button onClick={() => saveEdit(false)}>Publish</button>
            <button onClick={() => saveEdit(true)}>Save Draft</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <h1>{post.title}</h1>
          {post.draft && <span className="draft-tag">[Draft]</span>}
          <p>{new Date(post.created_at).toLocaleDateString()}</p>
          {postTags.length > 0 && (
            <div className="post-tags post-tags--detail" aria-label="Tags">
              {postTags.map((t) => (
                <span key={t.id} className="tag-pill">
                  {t.name}
                  {user?.id === ADMIN_ID && (
                    <button
                      type="button"
                      className="tag-pill-remove"
                      disabled={tagBusy}
                      onClick={() => handleRemoveTag(t.id)}
                      aria-label={`Remove tag ${t.name}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          <div className="post-content markdown-body">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </>
      )}

      {/* Admin-only controls */}
      {user && user.id === ADMIN_ID && !isEditing && (
        <div className="post-admin-footer">
          <div className="tag-editor">
            <input
              type="text"
              className="tag-editor-input"
              placeholder="Add tags (comma-separated)"
              value={newTagInput}
              disabled={tagBusy}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTags();
                }
              }}
            />
            <button
              type="button"
              disabled={tagBusy || !newTagInput.trim()}
              onClick={handleAddTags}
            >
              Add tags
            </button>
          </div>
          <div className="post-actions">
            <button
              onClick={() => {
                setEditTitle(post.title);
                setEditContent(post.content);
                setIsEditing(true);
              }}
            >
              Edit
            </button>
            <button onClick={handleDelete}>Delete</button>
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
