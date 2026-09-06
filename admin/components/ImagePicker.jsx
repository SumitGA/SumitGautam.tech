"use client";
import { useCallback, useEffect, useState } from "react";
import { cloudinaryUrl } from "../lib/cloudinary";

/* Choose an image already in Cloudinary instead of uploading another copy.
 *
 * The editor could previously only upload, so re-using a picture — a series
 * cover across every part, a diagram that belongs in two posts — created a
 * duplicate. That costs storage on a finite plan and, worse, leaves two
 * public_ids for one image, so deleting a post can only ever clean up half.
 */
export default function ImagePicker({ token, onPick, onClose }) {
  const [images, setImages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(
    async (next = null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/cloudinary-list${next ? `?cursor=${encodeURIComponent(next)}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load images.");
        setImages((prev) => (next ? [...prev, ...json.images] : json.images));
        setCursor(json.nextCursor);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => { load(); }, [load]);

  // Escape closes, because a modal that traps you is worse than no modal.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = filter.trim()
    ? images.filter((i) => i.publicId.toLowerCase().includes(filter.trim().toLowerCase()))
    : images;

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <strong>Choose an existing image</strong>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name"
            style={{ flex: 1, minWidth: 120 }}
          />
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>

        {error && <p style={{ color: "var(--danger, #c00)" }}>{error}</p>}
        {!error && !loading && shown.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            {filter ? "Nothing matches that." : "No images in this account yet."}
          </p>
        )}

        <div className="picker-grid">
          {shown.map((img) => (
            <button
              key={img.publicId}
              type="button"
              className="picker-item"
              onClick={() => { onPick(img); onClose(); }}
              title={`${img.publicId} · ${img.width}×${img.height}`}
            >
              <img
                src={cloudinaryUrl(img.publicId, { width: 200, height: 120 })}
                alt=""
                width={200}
                height={120}
                loading="lazy"
              />
              <span className="picker-name">{img.publicId}</span>
              <span className="picker-dims">{img.width}×{img.height}</span>
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}
        {cursor && !loading && (
          <button className="btn-secondary" onClick={() => load(cursor)}>
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
