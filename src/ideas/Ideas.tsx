import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Ideas.css";
import type { User } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  draft: boolean;
};

export default function Ideas() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [user, setUser] = useState<User | null>(null);

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
      const query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return;
      }

      setPosts((data ?? []) as Post[]);
      setLoading(false);
    }

    fetchPosts();
  }, [user]);

  // --- Delete post
  async function handleDelete(postId: number) {
    if (!user) return alert("You must be logged in to delete posts.");

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) console.error(error);
    else setPosts(posts.filter((p) => p.id !== postId));
  }

  // --- Edit post
  function startEdit(post: Post) {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  }

  function cancelEdit() {
    setEditingPostId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function saveEdit(postId: number, draftValue: boolean) {
    if (!user) return alert("You must be logged in to edit posts.");

    const { error } = await supabase
      .from("posts")
      .update({
        title: editTitle,
        content: editContent,
        draft: draftValue,
      })
      .eq("id", postId);

    if (error) console.error(error);
    else {
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                title: editTitle,
                content: editContent,
                draft: draftValue,
              }
            : p
        )
      );
      cancelEdit();
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // Create unique filename
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage bucket
      const { error: uploadError } = await supabase.storage
        .from("blogposts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("blogposts")
        .getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // Automatically insert Markdown image link
      setEditContent((prev) => `${prev}\n\n![image](${imageUrl})`);
      alert("✅ Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Image upload failed");
    }
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Ideas</h1>

      <div className="ideas-nav">
        <div className="links">
          <a href="/" style={styles.link}>
            /Main
          </a>
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
            <a href="/Write" style={styles.link}>
              /Write
            </a>
          </div>
        ) : (
          <a href="/Login" style={styles.link}>
            /Login
          </a>
        )}
      </div>

      {loading && <p>Loading posts...</p>}

      <div className="posts-list">
        {posts.map((post) => (
          <article key={post.id} className="post-item">
            {editingPostId === post.id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="edit-input"
                />

                {/* Rich Markdown editor */}
                <div className="md-editor">
                  <MDEditor
                    data-color-mode="light"
                    value={editContent}
                    onChange={(val) => setEditContent(val ?? "")} // 👈 coerce undefined to empty string                    height={300}
                    textareaProps={{
                      placeholder: `Edit your post in Markdown...
**Bold** 
*Italic* 
[Link](url)
- List item`,
                    }}
                  />
                </div>

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

                  <button onClick={() => saveEdit(post.id, false)}>
                    Publish
                  </button>
                  <button onClick={() => saveEdit(post.id, true)}>
                    Save Draft
                  </button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="post-title">
                  {post.title}{" "}
                  {post.draft && <span className="draft-tag">[Draft]</span>}
                </h2>

                <div className="post-content markdown-body">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>

                <p className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>

                {user && (
                  <div className="post-actions">
                    <button onClick={() => startEdit(post)}>Edit</button>
                    <button onClick={() => handleDelete(post.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </article>
        ))}
      </div>

      {!loading && posts.length === 0 && <p>No posts yet. Stay tuned!</p>}
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
