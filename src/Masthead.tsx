import type { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";

export default function Masthead({ children }: { children?: ReactNode }) {
  return (
    <header className="masthead">
      <Link to="/" className="masthead-name">
        Alexis NS
      </Link>
      <nav className="masthead-links" aria-label="Site">
        <NavLink to="/Ideas" end>
          Ideas
        </NavLink>
        {children}
      </nav>
    </header>
  );
}
