"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "../lib/analytics-client";

/* Records one pageview per route change.
 *
 * Deliberately keyed on pathname only. Reading search params here would require
 * wrapping the tree in Suspense, and query strings on this site carry nothing
 * worth segmenting by.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("pageview", { path: pathname });
  }, [pathname]);

  return null;
}
