// S3.1.1: shown in the content area while a lazy screen's code downloads. The shell stays visible.
export function RouteFallback() {
  return (
    <p className="muted" role="status" aria-live="polite">
      Loading…
    </p>
  );
}
