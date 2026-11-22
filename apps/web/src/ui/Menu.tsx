import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import "./menu.css";

export type MenuItem = { label: string; onSelect: () => void; disabled?: boolean };

// 1.4.2 dropdown menu (Radix): Enter, Space or arrow keys open it, arrows move, Esc closes and
// focus returns to the button. Non-modal on purpose: the modal mode injects a <style> tag for
// scroll locking, which our CSP blocks.
export function Menu({
  label,
  trigger,
  items,
}: {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
}) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="btn btn-compact" aria-label={label}>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu" align="end" sideOffset={4}>
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              className="menu-item"
              disabled={item.disabled}
              onSelect={item.onSelect}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
