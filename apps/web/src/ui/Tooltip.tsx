import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactElement } from "react";
import "./tooltip.css";

// Mounted once around the app (App.tsx).
export function TooltipProvider({ children }: { children: ReactElement }) {
  return <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>;
}

// 1.4.2 tooltip (Radix): extra hint on hover or keyboard focus. Touch screens never show it, so
// the trigger must make sense without it (give icon buttons an aria-label).
export function Tooltip({ text, children }: { text: string; children: ReactElement }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="tooltip" sideOffset={6}>
          {text}
          <RadixTooltip.Arrow className="tooltip-arrow" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
