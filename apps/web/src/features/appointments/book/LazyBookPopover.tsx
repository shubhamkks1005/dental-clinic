import { lazy, Suspense, type ComponentProps } from "react";

const BookPopover = lazy(() => import("./BookPopover").then((m) => ({ default: m.BookPopover })));

/** The booking popover for screens in the main bundle (Today, patient tab): loads on first use,
 * so the first page load stays small (S3.1.1). */
export function LazyBookPopover(props: ComponentProps<typeof BookPopover>) {
  return (
    <Suspense fallback={null}>
      <BookPopover {...props} />
    </Suspense>
  );
}
