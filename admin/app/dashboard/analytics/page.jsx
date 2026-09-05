"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../../lib/supabase";

/* Analytics dashboard.
 *
 * Every number comes from a Postgres function (see supabase/analytics_schema.sql)
 * so the browser fetches a few dozen aggregate rows rather than the event table.
 * The charts are hand-rolled SVG — a charting library would be the single
 * largest dependency in this app, for six panels.
 */

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const CONVERSION_LABELS = {
  contact_submit: "Contact form sent",
  resume_print: "Resume printed / saved",
  chat_open: "Chat opened",
  chat_message: "Chat message sent",
  outbound_click: "Outbound link clicked",
  case_study_view: "Case study viewed",
};

const nf = new Intl.NumberFormat();

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = getSupabaseBrowser();
    try {
      const [overview, series, paths, referrers, countries, devices, conversions, retention] =
        await Promise.all([
          sb.rpc("analytics_overview", { p_days: days }),
          sb.rpc("analytics_timeseries", { p_days: days }),
          sb.rpc("analytics_breakdown", { p_dimension: "path", p_days: days, p_limit: 8 }),
          sb.rpc("analytics_breakdown", { p_dimension: "referrer_host", p_days: days, p_limit: 8 }),
          sb.rpc("analytics_breakdown", { p_dimension: "country", p_days: days, p_limit: 8 }),
          sb.rpc("analytics_breakdown", { p_dimension: "device", p_days: days, p_limit: 5 }),
          sb.rpc("analytics_conversions", { p_days: days }),
          sb.rpc("analytics_retention", { p_weeks: 6 }),
        ]);

      const failed = [overview, series, paths, referrers, countries, devices, conversions, retention]
        .find((r) => r.error);
      if (failed) throw new Error(failed.error.message);

      setData({
        overview: overview.data?.[0] || null,
        series: series.data || [],
        paths: paths.data || [],
        referrers: referrers.data || [],
        countries: countries.data || [],
        devices: devices.data || [],
        conversions: conversions.data || [],
        retention: retention.data || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Analytics</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {RANGES.map((r) => (
            <button
              key={r.days}
              className={days === r.days ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: 13, padding: "7px 14px" }}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <strong style={{ color: "var(--danger)" }}>Could not load analytics.</strong>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>{error}</p>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
            If this says a function does not exist, run <code>supabase/analytics_schema.sql</code> in
            the Supabase SQL editor.
          </p>
        </div>
      )}

      {loading && !data && <div className="spinner" />}

      {data && (
        <>
          <KpiRow overview={data.overview} days={days} />
          <TrafficChart series={data.series} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Panel title="Conversions" hint="Share of sessions that performed the action">
              <ConversionTable rows={data.conversions} />
            </Panel>
            <Panel title="Top pages">
              <BreakdownTable rows={data.paths} unit="views" pick={(r) => r.pageviews} />
            </Panel>
            <Panel title="Referrers">
              <BreakdownTable rows={data.referrers} unit="visitors" pick={(r) => r.visitors} />
            </Panel>
            <Panel title="Countries">
              <BreakdownTable rows={data.countries} unit="visitors" pick={(r) => r.visitors} />
            </Panel>
            <Panel title="Devices">
              <BreakdownTable rows={data.devices} unit="visitors" pick={(r) => r.visitors} />
            </Panel>
          </div>

          <Panel title="Weekly retention" hint="Of the visitors first seen in a week, how many came back later">
            <RetentionGrid rows={data.retention} />
          </Panel>
        </>
      )}
    </div>
  );
}

/* ── KPI cards ─────────────────────────────────────────────────────────── */

function delta(current, previous) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  if (!isFinite(pct)) return null;
  return Math.round(pct);
}

function KpiRow({ overview, days }) {
  if (!overview) return null;
  const o = overview;
  const cards = [
    { label: "Visitors", value: nf.format(o.visitors), change: delta(o.visitors, o.prev_visitors) },
    { label: "Pageviews", value: nf.format(o.pageviews), change: delta(o.pageviews, o.prev_pageviews) },
    { label: "Sessions", value: nf.format(o.sessions) },
    { label: "Pages / session", value: Number(o.pages_per_session).toFixed(2) },
    { label: "Bounce rate", value: `${Number(o.bounce_rate).toFixed(1)}%`, invert: true },
    {
      label: "Returning",
      value: o.visitors ? `${Math.round((o.returning_visitors / o.visitors) * 100)}%` : "—",
      sub: `${nf.format(o.returning_visitors)} of ${nf.format(o.visitors)}`,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.1 }}>{c.value}</div>
          {c.sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{c.sub}</div>}
          {c.change != null && (
            <div
              style={{
                fontSize: 12,
                marginTop: 5,
                color:
                  c.change === 0
                    ? "var(--muted)"
                    : (c.change > 0) !== !!c.invert
                      ? "var(--success)"
                      : "var(--danger)",
              }}
            >
              {c.change > 0 ? "▲" : c.change < 0 ? "▼" : "•"} {Math.abs(c.change)}% vs previous {days}d
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Traffic chart ─────────────────────────────────────────────────────── */

function TrafficChart({ series }) {
  if (!series.length) return null;
  const W = 1000;
  const H = 180;
  const PAD = 4;
  const max = Math.max(1, ...series.map((d) => Number(d.pageviews)), ...series.map((d) => Number(d.visitors)));
  const x = (i) => (series.length === 1 ? W / 2 : (i / (series.length - 1)) * (W - PAD * 2) + PAD);
  const y = (v) => H - (Number(v) / max) * (H - PAD * 2) - PAD;
  const line = (key) => series.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const area = `${line("pageviews")} L${x(series.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;

  const totalViews = series.reduce((a, d) => a + Number(d.pageviews), 0);

  return (
    <Panel
      title="Traffic"
      hint={totalViews === 0 ? "No events recorded yet in this period" : undefined}
      right={<Legend />}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 180, display: "block" }}>
        <path d={area} fill="var(--accent)" opacity="0.13" />
        <path d={line("pageviews")} fill="none" stroke="var(--accent)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        <path d={line("visitors")} fill="none" stroke="var(--success)" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
        <span>{series[0]?.day}</span>
        <span>{series[series.length - 1]?.day}</span>
      </div>
    </Panel>
  );
}

function Legend() {
  const item = (color, label, dashed) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
      <span style={{ width: 14, height: 0, borderTop: `${dashed ? "2px dashed" : "3px solid"} ${color}` }} />
      {label}
    </span>
  );
  return (
    <span style={{ display: "flex", gap: 14 }}>
      {item("var(--accent)", "Pageviews")}
      {item("var(--success)", "Visitors", true)}
    </span>
  );
}

/* ── Tables ────────────────────────────────────────────────────────────── */

function Panel({ title, hint, right, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: hint ? 4 : 12 }}>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        {right}
      </div>
      {hint && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <p style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0" }}>{children}</p>;
}

function BreakdownTable({ rows, unit, pick }) {
  if (!rows.length) return <Empty>Nothing recorded yet.</Empty>;
  const max = Math.max(...rows.map(pick), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ position: "relative", padding: "7px 10px", borderRadius: 5, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute", inset: 0, width: `${(pick(r) / max) * 100}%`,
              background: "var(--accent)", opacity: 0.16,
            }}
          />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 13, gap: 12 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            <span style={{ color: "var(--muted)", flexShrink: 0 }}>
              {nf.format(pick(r))} {unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversionTable({ rows }) {
  if (!rows.length) return <Empty>No conversions recorded yet.</Empty>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ color: "var(--muted)", textAlign: "left" }}>
          <th style={{ padding: "4px 0", fontWeight: 500 }}>Action</th>
          <th style={{ padding: "4px 0", fontWeight: 500, textAlign: "right" }}>Total</th>
          <th style={{ padding: "4px 0", fontWeight: 500, textAlign: "right" }}>People</th>
          <th style={{ padding: "4px 0", fontWeight: 500, textAlign: "right" }}>Rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.event} style={{ borderTop: "1px solid var(--border)" }}>
            <td style={{ padding: "8px 0" }}>{CONVERSION_LABELS[r.event] || r.event}</td>
            <td style={{ padding: "8px 0", textAlign: "right" }}>{nf.format(r.total)}</td>
            <td style={{ padding: "8px 0", textAlign: "right", color: "var(--muted)" }}>{nf.format(r.visitors)}</td>
            <td style={{ padding: "8px 0", textAlign: "right" }}>{Number(r.rate).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Retention ─────────────────────────────────────────────────────────── */

function RetentionGrid({ rows }) {
  if (!rows.length) return <Empty>Not enough history yet — this fills in after a couple of weeks.</Empty>;

  const cohorts = [...new Set(rows.map((r) => r.cohort_week))].sort();
  const maxOffset = Math.max(...rows.map((r) => r.week_offset));
  // A cohort only produces a row for weeks it was active, so absent cells are
  // genuinely zero rather than missing data.
  const lookup = new Map(rows.map((r) => [`${r.cohort_week}:${r.week_offset}`, r]));
  const sizeOf = new Map(rows.map((r) => [r.cohort_week, r.cohort_size]));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 460 }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "4px 10px 8px 0", fontWeight: 500 }}>Week of</th>
            <th style={{ textAlign: "right", padding: "4px 12px 8px 0", fontWeight: 500 }}>Visitors</th>
            {Array.from({ length: maxOffset + 1 }, (_, i) => (
              <th key={i} style={{ padding: "4px 6px 8px", fontWeight: 500, minWidth: 44 }}>+{i}w</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((week) => (
            <tr key={week}>
              <td style={{ padding: "4px 10px 4px 0", whiteSpace: "nowrap" }}>{week}</td>
              <td style={{ padding: "4px 12px 4px 0", textAlign: "right", color: "var(--muted)" }}>
                {sizeOf.get(week)}
              </td>
              {Array.from({ length: maxOffset + 1 }, (_, i) => {
                const cell = lookup.get(`${week}:${i}`);
                const size = sizeOf.get(week) || 0;
                const pct = cell && size ? (cell.retained / size) * 100 : 0;
                return (
                  <td key={i} style={{ padding: 2 }}>
                    <div
                      title={cell ? `${cell.retained} of ${size}` : "0"}
                      style={{
                        padding: "5px 4px",
                        textAlign: "center",
                        borderRadius: 4,
                        background: pct ? `rgba(99, 102, 241, ${0.12 + (pct / 100) * 0.65})` : "transparent",
                        color: pct > 55 ? "#fff" : "var(--muted)",
                      }}
                    >
                      {pct ? `${Math.round(pct)}%` : "–"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
