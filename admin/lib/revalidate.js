/* Tells the portfolio to drop its cached pages after a content change.
 *
 * Deliberately swallows everything. A save that succeeded must never be
 * reported as failed because the cache push did not land — the content is in
 * the database either way, and the portfolio's revalidate timer will pick it
 * up regardless.
 */
export async function revalidateSite() {
  try {
    const res = await fetch("/api/revalidate", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!body?.revalidated) {
      console.warn("[revalidate] site not refreshed:", body?.reason || res.status);
    }
    return !!body?.revalidated;
  } catch (err) {
    console.warn("[revalidate] request failed:", err?.message);
    return false;
  }
}
