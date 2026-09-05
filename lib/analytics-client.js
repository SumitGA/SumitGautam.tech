"use client";

/* Client half of the analytics pipeline. Every function here is best-effort:
 * analytics must never throw into the page or block a navigation.
 *
 * Identity is two random UUIDs and nothing else — no fingerprinting, no cookie,
 * nothing derived from the visitor. The visitor id persists in localStorage so
 * returning visitors and retention can be measured; the session id lives in
 * sessionStorage so it ends with the tab.
 *
 * Storage can throw outright (Safari private mode, blocked site data), so every
 * access is guarded. When storage is unavailable we fall back to an in-memory
 * id: that visitor is counted, but looks new on their next visit.
 */

const VISITOR_KEY = "sg_vid";
const SESSION_KEY = "sg_sid";

let memoryVisitorId = null;
let memorySessionId = null;

function uuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readOrCreate(storage, key, memoryFallback) {
  try {
    const store = window[storage];
    const existing = store.getItem(key);
    if (existing) return existing;
    const created = uuid();
    store.setItem(key, created);
    return created;
  } catch {
    return memoryFallback();
  }
}

export function getVisitorId() {
  if (typeof window === "undefined") return null;
  return readOrCreate("localStorage", VISITOR_KEY, () => (memoryVisitorId ||= uuid()));
}

export function getSessionId() {
  if (typeof window === "undefined") return null;
  return readOrCreate("sessionStorage", SESSION_KEY, () => (memorySessionId ||= uuid()));
}

/* Fire and forget. keepalive lets the request survive the page unloading, which
 * matters for outbound clicks — without it, following the link cancels the
 * request before it leaves. */
export function track(event, { path, meta } = {}) {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      event,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      path: path ?? window.location.pathname,
      referrer: document.referrer || null,
      meta: meta || {},
    });

    // sendBeacon is the more reliable of the two during unload, but it cannot
    // set a content type Next will parse as JSON, so use fetch with keepalive
    // and let it fail quietly if the browser refuses.
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics is never worth an exception in the page */
  }
}
