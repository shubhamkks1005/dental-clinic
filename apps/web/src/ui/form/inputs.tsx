import type { ComponentProps } from "react";

type InputProps = Omit<ComponentProps<"input">, "type">;

// Mobile: "+91" shown in front, the phone opens the number pad. The shared rule (normaliseMobile)
// accepts spaces, +91 or a leading 0, so staff can type it any usual way.
export function MobileInput(props: InputProps) {
  return (
    <span className="mobile-input">
      <span className="mobile-prefix" aria-hidden="true">
        +91
      </span>
      <input
        className="input"
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        placeholder="98765 43210"
        {...props}
      />
    </span>
  );
}

// Date typed as DD/MM/YYYY (number pad on phones; the slashes are typed or left out as - or .).
export function DateInput(props: InputProps) {
  return (
    <input
      className="input"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/YYYY"
      maxLength={10}
      {...props}
    />
  );
}
