import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { fetchDraftImageBlobUrl, getStoredPat, isDraftImageUrl } from "../../lib/githubClient";

// Markdown <img> replacement: resolves private draft-repo image URLs via the PAT.
export default function MarkdownImage({
  src,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  node: _node, // react-markdown AST node, not a DOM attribute
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) {
  const needsAuth = typeof src === "string" && isDraftImageUrl(src);
  const [resolved, setResolved] = useState<string | undefined>(needsAuth ? undefined : src);

  useEffect(() => {
    const pat = getStoredPat();
    if (!needsAuth || !pat) {
      setResolved(src);
      return;
    }
    let blobUrl: string | undefined;
    let cancelled = false;
    fetchDraftImageBlobUrl(src as string, pat)
      .then((url) => {
        blobUrl = url;
        if (!cancelled) setResolved(url);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src, needsAuth]);

  return resolved ? <img src={resolved} {...props} /> : null;
}
