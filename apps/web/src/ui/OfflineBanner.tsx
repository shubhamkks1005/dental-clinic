import { useOnline } from "./use-online";

// 1.4.7: a bar across the top while the internet is gone, on every page.
export function OfflineBanner() {
  if (useOnline()) return null;
  return (
    <p className="offline-banner" role="alert">
      No internet connection. What you typed on this page is kept. Don't close this page. Saving and
      opening other pages wait until the internet is back.
    </p>
  );
}
