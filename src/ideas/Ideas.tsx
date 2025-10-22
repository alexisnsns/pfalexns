import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Ideas.css";
import type { User } from "@supabase/supabase-js";
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function Ideas() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ?? null);
    }
    getUser();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from("posts") // table name
        .select<Post>("*") // row type here
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else if (data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  async function handleDelete(postId: number) {
    if (!user) return alert("You must be logged in to delete posts.");
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) console.error(error);
    else setPosts(posts.filter((p) => p.id !== postId));
  }

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

  async function saveEdit(postId: number) {
    if (!user) return alert("You must be logged in to edit posts.");
    const { error } = await supabase
      .from("posts")
      .update({ title: editTitle, content: editContent })
      .eq("id", postId);

    if (error) console.error(error);
    else {
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, title: editTitle, content: editContent } : p
        )
      );
      cancelEdit();
    }
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Ideas</h1>

      <div className="ideas-nav">
        <div className="links">
          <a href="/">/Main</a>
          <a href="/Login">/Login</a>
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
          </div>
        ) : (
          <span>Not logged in</span>
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
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="edit-textarea"
                />
                <div className="edit-buttons">
                  <button onClick={() => saveEdit(post.id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.content}</p>
                <p className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}{" "}
                  {new Date(post.created_at).toLocaleTimeString()}
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
