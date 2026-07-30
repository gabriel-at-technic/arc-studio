import { useState } from "react";
import { useWorkspace } from "../lib/workspace";
import { useAuth } from "../lib/auth";
import { ARC_BLUE, AppIcon, type AppId } from "./AppHeader";

const RAIL_W = 56;

export function WorkspaceRail({
  currentApp,
  onNavigate,
  onOpenSettings,
  isDark,
}: {
  currentApp: AppId;
  onNavigate: (app: AppId) => void;
  onOpenSettings: () => void;
  isDark: boolean;
}) {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const { profile, signOut } = useAuth();
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const railBg = "#13171e";
  const railText = "#9ba3af";
  const railActive = "#fff";

  const initials = (profile?.display_name || profile?.email || "U")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const wsInitial = currentWorkspace?.name?.[0]?.toUpperCase() ?? "W";

  return (
    <div style={{
      width: `${RAIL_W}px`, flexShrink: 0, background: railBg,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "12px 0", gap: "8px", position: "relative",
      borderRight: "1px solid #2a2d33",
      fontFamily: "'Open Sans',Arial,sans-serif",
    }}>
      {/* Workspace selector */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setWsMenuOpen((v) => !v); setAccountOpen(false); }}
          title={currentWorkspace?.name ?? "Select workspace"}
          style={{
            width: "36px", height: "36px", borderRadius: "0",
            background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
            color: "#fff", display: "grid", placeItems: "center",
            fontSize: "15px", fontWeight: 700, border: "none", cursor: "pointer",
          }}
        >
          {wsInitial}
        </button>

        {wsMenuOpen && (
          <div style={{
            position: "absolute", top: "44px", left: 0,
            width: "200px", background: "#1a1f26",
            border: "1px solid #2a2d33", borderRadius: "0",
            padding: "8px", zIndex: 300,
          }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#656871", textTransform: "uppercase", letterSpacing: "0.6px", margin: "4px 8px 8px" }}>
              Workspaces
            </p>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { setCurrentWorkspace(ws); setWsMenuOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "10px",
                  padding: "8px", border: "none", borderRadius: "0",
                  background: ws.id === currentWorkspace?.id ? `${ARC_BLUE}33` : "transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{
                  width: "28px", height: "28px", borderRadius: "0",
                  background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
                  color: "#fff", display: "grid", placeItems: "center",
                  fontSize: "12px", fontWeight: 700, flexShrink: 0,
                }}>
                  {ws.name[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: ws.id === currentWorkspace?.id ? "#fff" : railText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ws.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: "24px", height: "1px", background: "#2a2d33", margin: "4px 0" }} />

      {/* Home icon */}
      <RailButton
        active={currentApp === "home"}
        onClick={() => onNavigate("home")}
        title="Home"
      >
        <AppIcon name="home" size={20} color={currentApp === "home" ? railActive : railText} />
      </RailButton>

      {/* Drive icon */}
      <RailButton
        active={currentApp === "drive"}
        onClick={() => onNavigate("drive")}
        title="Arc Drive"
      >
        <AppIcon name="drive" size={20} color={currentApp === "drive" ? railActive : railText} />
      </RailButton>

      {/* Paper icon */}
      <RailButton
        active={currentApp === "paper"}
        onClick={() => onNavigate("paper")}
        title="Loom Paper"
      >
        <AppIcon name="paper" size={20} color={currentApp === "paper" ? railActive : railText} />
      </RailButton>

      {/* Slate icon */}
      <RailButton
        active={currentApp === "slate"}
        onClick={() => onNavigate("slate")}
        title="Arc Slate"
      >
        <AppIcon name="slate" size={20} color={currentApp === "slate" ? railActive : railText} />
      </RailButton>

      {/* Ping icon */}
      <RailButton
        active={currentApp === "ping"}
        onClick={() => onNavigate("ping")}
        title="Arc Ping"
      >
        <AppIcon name="ping" size={20} color={currentApp === "ping" ? railActive : railText} />
      </RailButton>

      <div style={{ flex: 1 }} />

      {/* Account / Settings at bottom */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => { setAccountOpen((v) => !v); setWsMenuOpen(false); }}
          title="Account"
          style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
            color: "#fff", display: "grid", placeItems: "center",
            fontSize: "13px", fontWeight: 700, border: "none", cursor: "pointer",
          }}
        >
          {initials}
        </button>

        {accountOpen && (
          <div style={{
            position: "absolute", bottom: "0", left: "44px",
            width: "200px", background: "#1a1f26",
            border: "1px solid #2a2d33", borderRadius: "0",
            padding: "12px", zIndex: 300,
          }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>
              {profile?.display_name ?? "User"}
            </p>
            <p style={{ fontSize: "11px", color: "#656871", margin: "0 0 12px" }}>{profile?.email}</p>
            <button
              onClick={() => { onOpenSettings(); setAccountOpen(false); }}
              style={{
                width: "100%", padding: "8px", fontSize: "13px", fontWeight: 600,
                color: "#e6e6e6", background: "#0f1419",
                border: "none", borderRadius: "0", cursor: "pointer", marginBottom: "6px",
              }}
            >
              Settings
            </button>
            <button
              onClick={() => { signOut(); setAccountOpen(false); }}
              style={{
                width: "100%", padding: "8px", fontSize: "13px", fontWeight: 600,
                color: "#e6e6e6", background: "#0f1419",
                border: "none", borderRadius: "0", cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RailButton({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "36px", height: "36px", border: "none",
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        borderRadius: "0", cursor: "pointer",
        display: "grid", placeItems: "center", transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}
