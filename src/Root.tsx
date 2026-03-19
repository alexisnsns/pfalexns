import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import Ideas from "./ideas/Ideas";
import Write from "./ideas/Write";
import Login from "./ideas/Login";
import { supabase } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import PostPage from "./ideas/postPage";

function RouteAnalytics() {
  const { pathname, search } = useLocation();
  return <Analytics route={pathname} path={pathname + search} />;
}

export default function Root() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);


  return (
    <>
      <RouteAnalytics />
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
    </>
  );
}
