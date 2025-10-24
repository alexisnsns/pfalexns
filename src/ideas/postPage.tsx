import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";
import type { User } from "@supabase/supabase-js";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  draft: boolean;
};

const ADMIN_ID = "e0290332-fb6c-4c3b-937f-283095e3a008";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

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
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error(error);
      else setPost(data);

      setLoading(false);
    }

    fetchPost();
  }, [id]);

  // --- Delete post
  async function handleDelete() {
    if (!user || user.id !== ADMIN_ID) return alert("Not authorized.");
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", post?.id);
    if (error) console.error(error);
    else window.location.href = "/Ideas";
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

  if (loading) return <p>Loading...</p>;
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
          <div className="post-content markdown-body">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </>
      )}

      {/* Admin-only controls */}
      {user && user.id === ADMIN_ID && !isEditing && (
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
