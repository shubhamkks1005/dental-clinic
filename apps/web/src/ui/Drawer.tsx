import type { ReactNode } from "react";
import { Dialog } from "./Dialog";

// A panel from the right edge for "add" and "edit" forms (Library). Same native <dialog> as
// Dialog: focus moves in, Esc closes, focus returns to the button that opened it. Full width on a
// phone. Render the form only while `open`, so it starts empty each time.
export function Drawer(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return <Dialog {...props} variant="drawer" />;
}
