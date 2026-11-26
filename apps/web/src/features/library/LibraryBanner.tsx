import { LibraryIcon } from "./LibraryIcon";

export type Banner = { id: number; text: string };

// HTML 242-248: green banner under the tabs. M1 (220 ms) and M2 (320 ms) replay on every message
// because the parent keys it by id. No auto-hide; X closes it; a tab change hides it (L20).
export function LibraryBanner({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  return (
    <div className="ld-banner" role="status" aria-live="polite" data-testid="library-banner">
      <div className="ld-banner-text">
        <LibraryIcon name="check_circle" className="ld-check" />
        <span>{banner.text}</span>
      </div>
      <button type="button" className="ld-banner-close" aria-label="Dismiss" onClick={onClose}>
        <LibraryIcon name="close" className="ld-icon-sm" />
      </button>
    </div>
  );
}
