import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "../src/admin/AdminApp.tsx";
import "../src/admin/admin.css";

// Entry point of the standalone staff back office.
// It is built and deployed separately from the public site; see
// vite.admin.config.ts and docs/BACKEND.md.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
