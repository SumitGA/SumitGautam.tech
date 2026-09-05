"use client";
import { useState, useCallback } from "react";
import { revalidateSite } from "../lib/revalidate";

export function useToast() {
  const [toast, setToast] = useState(null);

  /* Success toasts push a cache invalidation to the portfolio.
   *
   * This is centralised here rather than called from each save handler on
   * purpose. There are nearly thirty success paths across nine admin pages in
   * three different shapes, and a missed one is a silent bug — the content
   * saves, the site keeps serving the old page, and nothing indicates why.
   * Hooking the toast means every existing save is covered and any page added
   * later inherits it without having to remember.
   *
   * The coupling holds because in this admin a success toast always follows a
   * successful mutation. If that ever stops being true, pass
   * `{ revalidate: false }` rather than working around it.
   */
  const show = useCallback((message, type = "success", { revalidate = true } = {}) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
    if (type === "success" && revalidate) {
      // Not awaited: the toast should appear immediately, and the save has
      // already succeeded regardless of what the cache push does.
      revalidateSite();
    }
  }, []);

  const Toast = toast ? (
    <div className={`toast ${toast.type}`}>{toast.message}</div>
  ) : null;

  return { show, Toast };
}
