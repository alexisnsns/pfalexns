import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Login from "./Login";
import "./Ideas.css";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

export default function Write() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    }
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!user) return <Login />;

  async function handleSubmit(e: React.FormEvent, draft: boolean) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("posts")
      .insert([{ title, content, draft }]); // 👈 explicitly insert draft

    if (error) {
      console.error(error);
      setMessage("Error creating post");
    } else {
      setTitle("");
      setContent("");
      setMessage(draft ? "Draft saved!" : "Post published!");
      navigate("/Ideas");
    }

    setLoading(false);
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Write a New Post</h1>

      <div className="ideas-nav">
        <a href="/Ideas">/Ideas</a>
        <div className="links">
          <span className="user-info">
            {user.email}{" "}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            >
              Logout
            </button>
          </span>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="write-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="edit-input"
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="edit-textarea"
          required
        />

        <div className="button-group">
          <button
            type="button"
            disabled={loading}
            className="post-button draft-button"
            onClick={(e) => handleSubmit(e, true)} // 👈 Save draft
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={loading}
            className="post-button publish-button"
            onClick={(e) => handleSubmit(e, false)} // 👈 Publish
          >
            {loading ? "Publishing..." : "Publish Publicly"}
          </button>
        </div>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
