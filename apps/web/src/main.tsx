// Base styles first: screen CSS imported through App must load after them to override them.
import "./styles/base.css";
import "./ui/ui.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { App } from "./App";
import { installErrorReporter } from "./features/errors";

installErrorReporter();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element in index.html");

// A data router (one catch-all route; App keeps its own <Routes>) so screens can warn before
// leaving with unsaved changes (useBlocker needs it).
const router = createBrowserRouter([{ path: "*", element: <App /> }]);

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
