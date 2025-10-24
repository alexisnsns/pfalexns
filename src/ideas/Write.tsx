import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Login from "./Login";
import "./Ideas.css";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import MDEditor from "@uiw/react-md-editor";

export default function Write() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // Markdown content
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
      .insert([{ title, content, draft }]); // explicitly insert draft

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

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // Create a unique file name
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("blogposts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("blogposts")
        .getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // Optionally insert into your Markdown editor automatically
      setContent((prev) => `${prev}\n\n![image](${imageUrl})`);

      setMessage("✅ Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Image upload failed");
    }
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Write a New Post</h1>

      <div className="ideas-nav">
        <a href="/Ideas" style={styles.link}>
          /Ideas
        </a>
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

        {/* Replace textarea with MDEditor */}
        <div className="md-editor">
          <MDEditor
            data-color-mode="light"
            value={content}
            onChange={(val) => setContent(val ?? "")} // 👈 coerce undefined to empty string            height={400}
            textareaProps={{
              placeholder: `Write your post in Markdown...
**Bold** 
*Italic* 
[Link](url)
- List item`,
            }}
          />
        </div>

        <div className="button-group">
          <label className="upload-button">
            📸 Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </label>

          <button
            type="button"
            disabled={loading}
            className="post-button draft-button"
            onClick={(e) => handleSubmit(e, true)}
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={loading}
            className="post-button publish-button"
            onClick={(e) => handleSubmit(e, false)}
          >
            {loading ? "Publishing..." : "Publish Publicly"}
          </button>
        </div>
      </form>

      {message && <p className="message">{message}</p>}
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
