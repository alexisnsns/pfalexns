import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Ideas from "./ideas/Ideas";
import Write from "./ideas/Write";
import Login from "./ideas/Login";
import { getStoredPat } from "../lib/githubClient";
import PostPage from "./ideas/postPage";

export default function Root() {
  const [pat, setPat] = useState<string | null>(() => getStoredPat());

  useEffect(() => {
    function onStorage() {
      setPat(getStoredPat());
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("pfalexns-pat-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pfalexns-pat-changed", onStorage);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/Ideas" element={<Ideas />} />
      <Route
        path="/Write"
        element={pat ? <Write /> : <Navigate to="/Login" replace />}
      />
      <Route path="/Login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/Ideas/:slug" element={<PostPage />} />
    </Routes>
  );
}
