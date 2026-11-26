import { isListKey } from "@clinic/shared";
import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import { NotFound } from "../../ui/PageMessage";
import { LibraryPage } from "./LibraryPage";
import { MORE_LISTS } from "./LibraryTabs";
import "../../styles/design-fonts.css";
import "./library-doc.css";
import "./library-body.css";
import "./library-cards.css";
import "./library-banner.css";
import "./library-list.css";

// docs/design/final/library_align_dentistry (7).html, with the owner's answers (handoff
// docs/design/handoff/library.md). The page is keyed by list: a tab change starts clean (L20).
function ListRoute() {
  const { key = "" } = useParams();
  if (!isListKey(key)) return <NotFound />;
  return <LibraryPage key={key} listKey={key} />;
}

export function LibraryScreen() {
  useEffect(() => {
    document.body.classList.add("ld-page");
    return () => document.body.classList.remove("ld-page");
  }, []);
  return (
    <Routes>
      <Route index element={<Navigate to="medicines" replace />} />
      <Route path="more" element={<Navigate to={`../${MORE_LISTS[0]}`} replace />} />
      <Route path=":key" element={<ListRoute />} />
    </Routes>
  );
}
