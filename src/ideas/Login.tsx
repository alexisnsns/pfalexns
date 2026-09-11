import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { unlockWithPassphrase } from "../../lib/githubClient";
import "./Ideas.css";

export default function Login() {
  const [passphrase, setPassphrase] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await unlockWithPassphrase(passphrase);
      navigate("/Write");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not unlock.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ideas-container">
      <h1 className="ideas-title">Unlock</h1>

      <form onSubmit={handleUnlock} className="write-form">
        <input
          type="password"
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="edit-input"
          required
          autoFocus
        />
        <button type="submit" className="post-button" disabled={loading}>
          {loading ? "Unlocking..." : "Unlock"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
