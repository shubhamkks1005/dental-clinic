import type { ComponentProps } from "react";

// The one input family (Q2.10): 12 px radius, 44-48 px high, Inter. Features use these and never
// a raw <input>, <select> or <textarea> (lint rule). `ref` works as a normal prop (React 19).
const withInput = (className?: string) =>
  className?.split(/\s+/).includes("input")
    ? className
    : `input${className ? ` ${className}` : ""}`;

export function TextInput({ className, ...rest }: ComponentProps<"input">) {
  return <input {...rest} className={withInput(className)} />;
}

export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select {...rest} className={withInput(className)} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={withInput(className)} />;
}

export function Checkbox(props: Omit<ComponentProps<"input">, "type">) {
  return <input {...props} type="checkbox" />;
}

export function Radio(props: Omit<ComponentProps<"input">, "type">) {
  return <input {...props} type="radio" />;
}

/** Range slider, colour picker and file picker keep their native look. */
export function NativeInput(props: ComponentProps<"input">) {
  return <input {...props} />;
}
