import type { ReactNode } from "react";

// Small stroke icons drawn for this app (no icon library). Decorative: the label is always shown.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
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

export const icons = {
  today: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  patients: (
    <Icon>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2" />
    </Icon>
  ),
  calendar: (
    <Icon>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  ),
  billing: (
    <Icon>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </Icon>
  ),
  messages: (
    <Icon>
      <path d="M4 5h16v11H9l-5 4z" />
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M5 20V11M12 20V5M19 20v-7" />
    </Icon>
  ),
  library: (
    <Icon>
      <path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3V4zM5 17a3 3 0 013-3h10M9 8h5" />
    </Icon>
  ),
  settings: (
    <Icon>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Icon>
  ),
  more: (
    <Icon>
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </Icon>
  ),
  search: (
    <Icon>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  ),
  plus: (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  // Doctor Today (final design): the same shapes as its Material Symbols, drawn as strokes.
  coffee: (
    <Icon>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" />
      <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
      <path d="M8 3v2M12 3v2" />
    </Icon>
  ),
  chevronDown: (
    <Icon>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  ),
  stretch: (
    <Icon>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 8v6m0 0-3 6m3-6 3 6M5 11l7-2 7 2" />
    </Icon>
  ),
  leaf: (
    <Icon>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
      <path d="M5 19c3-5 6-8 10-10" />
    </Icon>
  ),
  restaurant: (
    <Icon>
      <path d="M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2 1-3 4-3 8h3" />
    </Icon>
  ),
  warning: (
    <Icon>
      <path d="M12 4 3 20h18Z" />
      <path d="M12 10v4m0 3v.01" />
    </Icon>
  ),
  sync: (
    <Icon>
      <path d="M20 11a8 8 0 0 0-14-4M4 5v3h3M4 13a8 8 0 0 0 14 4m2 2v-3h-3" />
    </Icon>
  ),
  arrowUp: (
    <Icon>
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </Icon>
  ),
  walk: (
    <Icon>
      <circle cx="13" cy="4" r="2" />
      <path d="m10 21 2-6-3-3 2-5 4 3 3 1m-7 4 4 3v4" />
    </Icon>
  ),
  personOff: (
    <Icon>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3-6 7-6s7 2 7 6M4 4l16 16" />
    </Icon>
  ),
  eventRepeat: (
    <Icon>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4m6-4v4M9 15h5l-1.5-1.5M14 15l-1.5 1.5" />
    </Icon>
  ),
  cancel: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </Icon>
  ),
  panelOpen: (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16m4-8h5m0 0-2-2m2 2-2 2" />
    </Icon>
  ),
  panelClose: (
    <Icon>
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
    </Icon>
  ),
  editNote: (
    <Icon>
      <path d="M4 7h10M4 12h6M4 17h5" />
      <path d="m14 19 1-4 6-6 3 3-6 6Z" transform="translate(-3 0) scale(.9)" />
    </Icon>
  ),
  taskDone: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 3 3 5-6" />
    </Icon>
  ),
  sun: (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" />
    </Icon>
  ),
  sunset: (
    <Icon>
      <path d="M5 18a7 7 0 0 1 14 0M2 18h20M12 5v4M5 8l2 2m12-2-2 2" />
    </Icon>
  ),
  clock: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  close: (
    <Icon>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  ),
};

export type IconName = keyof typeof icons;
