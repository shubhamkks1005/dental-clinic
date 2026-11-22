import { useOnline } from "./use-online";

// 1.4.7: a bar across the top while the internet is gone, on every page.
export function OfflineBanner() {
  if (useOnline()) return null;
  return (
    <p className="offline-banner" role="alert">
      No internet connection. Don't close this page. Wait for the internet to come back, then try
      again.
    </p>
  );
}
