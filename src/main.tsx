import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "./index.css";
import Root from "./Root";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Root />
    </HashRouter>
  </StrictMode>
);
