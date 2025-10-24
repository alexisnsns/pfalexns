import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ReactMarkdown from "react-markdown";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  draft: boolean;
};

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading...</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="ideas-container">
      <Link style={styles.link} to="/Ideas">
        ← Back to Ideas
      </Link>
      <h1>{post.title}</h1>
      {post.draft && <span className="draft-tag">[Draft]</span>}
      <p>{new Date(post.created_at).toLocaleDateString()}</p>
      <div className="post-content markdown-body">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
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
