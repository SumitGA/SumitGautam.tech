"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowser } from "../../lib/supabase";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/greeting", label: "Greeting & Bio" },
  { href: "/dashboard/skills", label: "Skills" },
  { href: "/dashboard/experience", label: "Experience" },
  { href: "/dashboard/education", label: "Education" },
  { href: "/dashboard/certifications", label: "Certifications" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/contact", label: "Contact" },
  { href: "/dashboard/resume", label: "Resume / CV" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function handleLogout() {
    await getSupabaseBrowser().auth.signOut();
  }

  if (checking) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px", marginBottom: 28 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Portfolio Admin</span>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "9px 20px",
                  fontSize: 14,
                  color: active ? "#fff" : "var(--muted)",
                  background: active ? "var(--accent)" : "transparent",
                  borderRadius: "0 6px 6px 0",
                  marginRight: 12,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "0 20px" }}>
          <button className="btn-secondary" style={{ width: "100%", fontSize: 13 }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 36px", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
