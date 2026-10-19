import { useState } from "react";
import {
  getStoredPat,
  clearPat,
  slugify,
  saveDraft,
  publishPost,
  uploadImage,
} from "../../lib/githubClient";
import Login from "./Login";
import "./Ideas.css";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { parseTagInput } from "../../lib/postTags";

export default function Write() {
  const navigate = useNavigate();
  const pat = getStoredPat();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [busy, setBusy] = useState<"draft" | "publish" | "image" | null>(null);
  const [message, setMessage] = useState("");

  if (!pat) return <Login />;

  async function handleSubmit(e: React.FormEvent, draft: boolean) {
    e.preventDefault();
    if (!pat) return;
    setBusy(draft ? "draft" : "publish");
    setMessage("");

    const post = {
      slug: slugify(title),
      title,
      content,
      created_at: new Date().toISOString(),
      tags: parseTagInput(tagsInput),
    };

    try {
      if (draft) {
        await saveDraft(post, pat);
        setMessage("Draft saved!");
      } else {
        await publishPost(post, pat);
        setMessage("Post published!");
      }
      setTitle("");
      setContent("");
      setTagsInput("");
      navigate("/Ideas");
    } catch (err) {
      console.error(err);
      setMessage(draft ? "Error saving draft" : "Error publishing post");
    }

    setBusy(null);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file || !pat) return;
      setBusy("image");
      const slug = slugify(title || "untitled");
      const imageUrl = await uploadImage(file, slug, true, pat);
      setContent((prev) => `${prev}\n\n![image](${imageUrl})`);
      setMessage("✅ Image uploaded successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Image upload failed");
    } finally {
      setBusy(null);
      event.target.value = "";
    }
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Write a New Post</h1>

      <div className="ideas-nav">
        <a href="/#/Ideas" style={styles.link}>
          /Ideas
        </a>
        <div className="links">
          <span className="user-info">
            <button onClick={() => clearPat()}>Logout</button>
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

        <input
          type="text"
          placeholder="Tags (optional, comma-separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="edit-input"
          aria-label="Tags"
        />

        <div className="md-editor">
          <MDEditor
            data-color-mode="light"
            value={content}
            onChange={(val) => setContent(val ?? "")}
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
            {busy === "image" ? "Uploading..." : "📸 Upload Image"}
            <input
              type="file"
              accept="image/*"
              disabled={!!busy}
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </label>

          <button
            type="button"
            disabled={!!busy}
            className="post-button draft-button"
            onClick={(e) => handleSubmit(e, true)}
          >
            {busy === "draft" ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={!!busy}
            className="post-button publish-button"
            onClick={(e) => handleSubmit(e, false)}
          >
            {busy === "publish" ? "Publishing..." : "Publish Publicly"}
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
