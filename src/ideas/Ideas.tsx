import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Ideas.css";
import type { User } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";

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
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is not logged in, only fetch published posts
      if (!user) {
        query = query.eq("draft", false);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return;
      }

      setPosts((data ?? []) as Post[]);
      setLoading(false);
    }

    fetchPosts();
  }, [user]); // re-fetch when user logs in/out

  // --- Delete post
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
        draft: draftValue, // <-- use the passed value
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

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Ideas</h1>

      <div className="ideas-nav">
        <div className="links">
          <a href="/">/Main</a>
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
            <a href="/Write">/Write</a>
          </div>
        ) : (
          <a href="/Login">/Login</a>
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
                  <button
                    onClick={() => saveEdit(post.id, false)} // Publish
                  >
                    Public Publish
                  </button>
                  <button
                    onClick={() => saveEdit(post.id, true)} // Save Draft
                  >
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
                <p className="post-content">
                  {" "}
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </p>
                <p className="post-date">
                  {new Date(post.created_at).toLocaleDateString()}{" "}
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
