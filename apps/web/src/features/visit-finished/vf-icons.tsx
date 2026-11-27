import type { ReactNode } from "react";

// Stroke icons for the visit finished page (the Material Symbols subset font does not hold these
// glyphs). Decorative: every button also has its words.
function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={`vf-svg ${className ?? ""}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const P = {
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  send: <path d="m4 12 16-8-6 16-3-7-7-1Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  download: <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />,
  print: (
    <path d="M7 8V4h10v4M7 17H5a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" />,
  add: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13" />,
  pay: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  warning: <path d="M12 4 2.5 20h19L12 4Zm0 6v4m0 3v.5" />,
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6m0 3v.5" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-2 5.5M20 4v7h-7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  stethoscope: (
    <path d="M6 3v6a4 4 0 0 0 8 0V3m-4 10v3a4 4 0 0 0 8 0v-2m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  ),
  file: <path d="M7 3h7l5 5v13H7V3Zm7 0v5h5" />,
  resize: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
  draft: <path d="M5 3h9l5 5v13H5V3Zm4 10h6m-6 4h4" />,
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
} as const;

export type VfIconName = keyof typeof P;

export function VfIcon({ name, className }: { name: VfIconName; className?: string }) {
  return <Svg className={className}>{P[name]}</Svg>;
}
