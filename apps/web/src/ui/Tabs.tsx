import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { nextTabIndex } from "./tabs-keys";
import "./tabs.css";

export type TabItem = { id: string; label: string; content: ReactNode };

// 1.4.2 tabs (look of S11 "Reminders / Recall list / Templates"). Only the selected tab is in
// the Tab order; arrow keys, Home and End move between tabs and show that tab at once.
export function Tabs({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const base = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = Math.max(
    0,
    tabs.findIndex((t) => t.id === value),
  );

  function onKeyDown(event: KeyboardEvent) {
    const next = nextTabIndex(selected, event.key, tabs.length);
    const tab = next === null ? undefined : tabs[next];
    if (next === null || !tab) return;
    event.preventDefault();
    onChange(tab.id);
    buttons.current[next]?.focus();
  }

  const current = tabs[selected];
  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={i === selected}
            aria-controls={`${base}-panel`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current && (
        <div
          className="tabs-panel"
          role="tabpanel"
          id={`${base}-panel`}
          aria-labelledby={`${base}-tab-${current.id}`}
          tabIndex={0}
        >
          {current.content}
        </div>
      )}
    </div>
  );
}
