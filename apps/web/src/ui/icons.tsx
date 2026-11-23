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
};

export type IconName = keyof typeof icons;
