import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./Ideas.css";
import type { User } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

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
      const { data, error } = await supabase
        .from("posts")
        .select("*")
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

      {loading && <p>Loading posts...</p>}

      <div className="posts-list">
        {posts.map((post) => (
          <article key={post.id} className="post-item">
            <Link
              to={`/Ideas/${post.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h2 className="post-title">
                {post.title}{" "}
                {post.draft && <span className="draft-tag">[Draft]</span>}
              </h2>

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
