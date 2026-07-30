import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ARC_APPS, ARC_BLUE, AppIcon, type AppId } from "../components/AppHeader";
import { useWorkspace } from "../lib/workspace";

type FileRow = { id: string; name: string; type: string; source_app: string; created_at: string };

export default function HomeScreen({
  onNavigate,
  isDark,
}: {
  onNavigate: (app: AppId) => void;
  isDark: boolean;
}) {
  const [recentFiles, setRecentFiles] = useState<FileRow[]>([]);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("files")
        .select("id, name, type, source_app, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      setRecentFiles((data as FileRow[]) ?? []);
    })();
  }, []);

  const bg = isDark ? "#0f1419" : "#f7f9fc";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";
  const cardBg = isDark ? "#1a1f26" : "#fff";
  const hoverBorder = isDark ? "#3a3d43" : "#d4d7e0";

  const tiles = ARC_APPS.filter((a) => a.id !== "home");

  return (
    <div style={{ background: bg, minHeight: "100%", padding: "32px 40px 48px", fontFamily: "'Open Sans','Helvetica Neue',Arial,sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: textPrimary, margin: 0, letterSpacing: "-0.4px" }}>
          {currentWorkspace ? currentWorkspace.name : "Creative Apps"}
        </h1>
        <p style={{ fontSize: "14px", color: textSecondary, marginTop: "6px" }}>
          Your all-in-one creative suite — pick an app to get started.
        </p>
      </div>

      {/* CC-style tile grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "16px",
        marginBottom: "40px",
      }}>
        {tiles.map((app) => (
          <button
            key={app.id}
            onClick={() => app.live && onNavigate(app.id)}
            disabled={!app.live}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "14px", padding: "28px 20px",
              background: cardBg, border: `1px solid ${border}`, borderRadius: "14px",
              cursor: app.live ? "pointer" : "default",
              opacity: app.live ? 1 : 0.5, transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
              textAlign: "center",
            }}
            onMouseEnter={(e) => { if (app.live) { e.currentTarget.style.borderColor = hoverBorder; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = border; }}
          >
            <div style={{
              width: "56px", height: "56px", borderRadius: "14px",
              background: app.live
                ? `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`
                : isDark ? "#2a2d33" : "#e8eaed",
              display: "grid", placeItems: "center",
              boxShadow: app.live ? `0 4px 14px ${ARC_BLUE}33` : "none",
            }}>
              <AppIcon name={app.icon} size={28} color={app.live ? "#fff" : "#8c8c94"} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: textPrimary, margin: 0 }}>{app.name}</p>
              <p style={{ fontSize: "12px", color: textSecondary, margin: "4px 0 0" }}>{app.tagline}</p>
            </div>
            {app.live ? (
              <span style={{
                fontSize: "11px", fontWeight: 700, color: ARC_BLUE,
                textTransform: "uppercase", letterSpacing: "0.6px",
              }}>
                Open
              </span>
            ) : (
              <span style={{
                fontSize: "10px", fontWeight: 600, color: textSecondary,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>
                Coming soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recent files */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: textPrimary, margin: "0 0 16px" }}>
        Recent Files
      </h2>
      {recentFiles.length === 0 ? (
        <div style={{
          padding: "40px 24px", background: cardBg, borderRadius: "12px",
          border: `1px solid ${border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: "14px", color: textSecondary, margin: 0 }}>
            No files yet. Files you create in Loom Paper, Loom Editor, or Loom Sign will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {recentFiles.map((f) => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 14px", background: cardBg, borderRadius: "10px",
              border: `1px solid ${border}`,
            }}>
              <FileGlyph type={f.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </p>
                <p style={{ fontSize: "11px", color: textSecondary, margin: "2px 0 0" }}>
                  {f.source_app} · {new Date(f.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FileGlyph({ type }: { type: string }) {
  const colors: Record<string, string> = {
    document: "#006ce0", pdf: "#db0000", signature: "#7300e5", asset: "#00802f",
  };
  const c = colors[type] ?? "#656871";
  return (
    <div style={{
      width: "32px", height: "32px", borderRadius: "7px",
      background: `${c}15`, display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 3 H15 L19 7 V21 H6 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M15 3 V7 H19" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}
