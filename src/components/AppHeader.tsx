import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/auth";
const arcLogoImg = "/arc-studio-logo.webp";

export const ARC_BLUE = "#2f74f6";

export type AppId = "home" | "drive" | "paper" | "editor" | "sign" | "slate" | "ping";

export type AppMeta = {
  id: AppId;
  name: string;
  tagline: string;
  live: boolean;
  icon: string;
};

export const ARC_APPS: AppMeta[] = [
  { id: "home",   name: "Arc Studio", tagline: "Your creative suite hub",    live: true,  icon: "home"   },
  { id: "drive",  name: "Arc Drive",  tagline: "File storage & management",  live: true,  icon: "drive"  },
  { id: "paper",  name: "Loom Paper", tagline: "Document writing",            live: true,  icon: "paper"  },
  { id: "editor", name: "Loom Editor",tagline: "PDF editor",                  live: false, icon: "editor" },
  { id: "sign",   name: "Loom Sign",  tagline: "Document signing",            live: false, icon: "sign"   },
  { id: "slate",  name: "Arc Slate",  tagline: "Creative asset gallery",      live: true,  icon: "slate"  },
  { id: "ping",   name: "Arc Ping",   tagline: "Team messaging & calls",      live: true,  icon: "ping"   },
];

export function AppIcon({ name, size = 24, color = "#fff" }: { name: string; size?: number; color?: string }) {
  const s = size;
  switch (name) {
    case "home":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "drive":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M5 16 L10 7 H14 L19 16 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="14" r="1.5" fill={color} />
        </svg>
      );
    case "paper":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M6 3 H15 L19 7 V21 H6 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
          <path d="M9 11 H16 M9 14 H16 M9 17 H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "editor":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8" fill="none" />
          <path d="M9 8 H15 M9 12 H15 M9 16 H12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "sign":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M3 17 L9 11 L13 15 L21 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M15 7 H21 V13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "slate":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.8" fill="none" />
          <circle cx="8" cy="10" r="1.5" fill={color} />
          <path d="M3 16 L9 11 L14 15 L17 12 L21 16" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "ping":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M4 5 H20 V15 H13 L8 19 V15 H4 Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
          <circle cx="9" cy="10" r="1.2" fill={color} />
          <circle cx="13" cy="10" r="1.2" fill={color} />
          <circle cx="17" cy="10" r="1.2" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

export function AppHeader({
  currentApp,
  onNavigate,
  onOpenPing,
  onOpenSlate,
  isDark,
  onOpenSettings,
}: {
  currentApp: AppId;
  onNavigate: (app: AppId) => void;
  onOpenPing: () => void;
  onOpenSlate: () => void;
  isDark: boolean;
  onOpenSettings: () => void;
}) {
  const { profile, signOut } = useAuth();
  const [waffleOpen, setWaffleOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const waffleRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (waffleRef.current && !waffleRef.current.contains(e.target as Node)) setWaffleOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (profile?.display_name || profile?.email || "U")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const hdr = "#1a1a2e";
  const hdrBorder = "#2a2d55";
  const hdrText = "#e6e6e6";
  const hdrHover = "rgba(255,255,255,0.08)";

  return (
    <header style={{
      height: "52px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "0 16px",
      background: hdr,
      borderBottom: `1px solid ${hdrBorder}`,
      position: "sticky",
      top: 0,
      zIndex: 200,
      fontFamily: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Waffle menu — 9 big filled squares */}
      <div ref={waffleRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setWaffleOpen((v) => !v); setAccountOpen(false); }}
          aria-label="App switcher"
          style={{
            width: "40px", height: "40px", border: "none",
            background: waffleOpen ? hdrHover : "transparent",
            borderRadius: "0", cursor: "pointer",
            display: "grid", placeItems: "center", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = hdrHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = waffleOpen ? hdrHover : "transparent")}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={col * 8}
                  y={row * 8}
                  width="6"
                  height="6"
                  rx="0"
                  fill={hdrText}
                />
              ))
            )}
          </svg>
        </button>

        {waffleOpen && (
          <div style={{
            position: "absolute", top: "48px", left: 0,
            width: "320px",
            background: "#ffffff",
            border: `1px solid #dde1e6`,
            borderRadius: "0",
            padding: "20px",
            zIndex: 300,
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#656871", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 16px" }}>
              Arc Studio Apps
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
              {ARC_APPS.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { if (app.live) { onNavigate(app.id); setWaffleOpen(false); } }}
                  disabled={!app.live}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                    padding: "14px 8px", border: "none",
                    background: "transparent", borderRadius: "0",
                    cursor: app.live ? "pointer" : "not-allowed",
                    opacity: app.live ? 1 : 0.45, transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => app.live && (e.currentTarget.style.background = "#f0f4ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "0",
                    background: app.live
                      ? `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`
                      : "#e8eaed",
                    display: "grid", placeItems: "center",
                  }}>
                    <AppIcon name={app.icon} size={22} color={app.live ? "#fff" : "#8c8c94"} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#1a1a2e", textAlign: "center", lineHeight: "1.3" }}>
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Arc Studio logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "4px" }}>
        <img src={arcLogoImg} alt="Arc Studio" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
        <span style={{ fontSize: "15px", fontWeight: 700, color: hdrText, letterSpacing: "-0.2px" }}>
          Arc Studio
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Arc Slate quick button */}
      <button
        onClick={onOpenSlate}
        aria-label="Open Arc Slate"
        title="Arc Slate — Asset Gallery"
        style={{
          width: "38px", height: "38px", border: "none", background: "transparent",
          borderRadius: "0", cursor: "pointer", display: "grid", placeItems: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = hdrHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <AppIcon name="slate" size={20} color={hdrText} />
      </button>

      {/* Arc Ping quick button */}
      <button
        onClick={onOpenPing}
        aria-label="Open Arc Ping"
        title="Arc Ping — Messages & Calls"
        style={{
          width: "38px", height: "38px", border: "none", background: "transparent",
          borderRadius: "0", cursor: "pointer", display: "grid", placeItems: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = hdrHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <AppIcon name="ping" size={20} color={hdrText} />
      </button>

      {/* Account */}
      <div ref={accountRef} style={{ position: "relative" }}>
        <button
          onClick={() => { setAccountOpen((v) => !v); setWaffleOpen(false); }}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            border: "none", background: "transparent", borderRadius: "0",
            cursor: "pointer", padding: "4px 8px 4px 4px", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = hdrHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
            color: "#fff", display: "grid", placeItems: "center",
            fontSize: "12px", fontWeight: 700,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: hdrText }}>
            {profile?.display_name ?? "Account"}
          </span>
        </button>

        {accountOpen && (
          <div style={{
            position: "absolute", top: "46px", right: 0, width: "240px",
            background: "#fff",
            border: `1px solid #dde1e6`,
            borderRadius: "0",
            padding: "16px", zIndex: 300,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
                color: "#fff", display: "grid", placeItems: "center",
                fontSize: "15px", fontWeight: 700,
              }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
                  {profile?.display_name ?? "User"}
                </p>
                <p style={{ fontSize: "12px", color: "#8c8c94", margin: "2px 0 0" }}>{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={() => { onOpenSettings(); setAccountOpen(false); }}
              style={{
                width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600,
                color: "#1a1a2e", background: "#f0f2f5",
                border: "none", borderRadius: "0", cursor: "pointer", marginBottom: "8px",
              }}
            >
              Settings
            </button>
            <button
              onClick={() => { signOut(); setAccountOpen(false); }}
              style={{
                width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600,
                color: "#1a1a2e", background: "#f0f2f5",
                border: "none", borderRadius: "0", cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
