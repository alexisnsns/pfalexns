import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Ideas from "./ideas/Ideas";
import Write from "./ideas/Write";
import Login from "./ideas/Login";
import { supabase } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import PostPage from "./ideas/postPage";

export default function Root() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/Ideas" element={<Ideas />} />
      <Route
        path="/Write"
        element={user ? <Write /> : <Navigate to="/Login" replace />}
      />
      <Route path="/Login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/Ideas/:id" element={<PostPage />} /> {/* dynamic URL */}
    </Routes>
  );
}
