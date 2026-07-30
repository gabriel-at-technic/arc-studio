import { useState, useEffect } from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { AuthProvider, useAuth } from "./lib/auth";
import { WorkspaceProvider, useWorkspace } from "./lib/workspace";
import { supabase } from "./lib/supabase";
import { AppHeader, AppIcon, ARC_APPS, ARC_BLUE, type AppId } from "./components/AppHeader";
import { WorkspaceRail } from "./components/WorkspaceRail";
import { SettingsPanel } from "./components/SettingsPanel";
import { PingWindow } from "./components/PingWindow";
import { SlateWindow } from "./components/SlateWindow";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import SetupWizard from "./screens/SetupWizard";
import HomeScreen from "./screens/HomeScreen";
import DriveScreen from "./screens/DriveScreen";
import PaperScreen from "./screens/PaperScreen";
import PingScreen from "./screens/PingScreen";
import SlateScreen from "./screens/SlateScreen";

const SIDEBAR_W = 200;
const STORAGE_LIMIT = 100;

function Sidebar({
  currentApp,
  onNavigate,
  isDark,
  fileCount,
}: {
  currentApp: AppId;
  onNavigate: (app: AppId) => void;
  isDark: boolean;
  fileCount: number;
}) {
  const sbBg = "#1e2235";
  const sbText = "#9ba3af";
  const sbActive = "#fff";
  const sbActiveBg = `${ARC_BLUE}33`;
  const sbHover = "rgba(255,255,255,0.07)";

  const navApps = ARC_APPS.filter((a) => a.id !== "home");

  return (
    <aside style={{
      width: `${SIDEBAR_W}px`, flexShrink: 0, background: sbBg,
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      fontFamily: "'Open Sans','Helvetica Neue',Arial,sans-serif",
      borderRight: `1px solid #2a2d4a`,
    }}>
      <div style={{ padding: "16px 12px 8px" }}>
        <button
          onClick={() => onNavigate("home")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 12px", border: "none", borderRadius: "0", cursor: "pointer",
            background: currentApp === "home" ? sbActiveBg : "transparent",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (currentApp !== "home") e.currentTarget.style.background = sbHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = currentApp === "home" ? sbActiveBg : "transparent"; }}
        >
          <AppIcon name="home" size={18} color={currentApp === "home" ? sbActive : sbText} />
          <span style={{ fontSize: "13px", fontWeight: currentApp === "home" ? 700 : 500, color: currentApp === "home" ? sbActive : sbText }}>
            Home
          </span>
        </button>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "4px 16px" }} />

      <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(155,163,175,0.6)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "12px 16px 6px" }}>
        Apps
      </p>

      <nav style={{ padding: "0 12px", flex: 1 }}>
        {navApps.map((app) => {
          const active = currentApp === app.id;
          return (
            <button
              key={app.id}
              onClick={() => app.live && onNavigate(app.id)}
              disabled={!app.live}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", border: "none", borderRadius: "0",
                cursor: app.live ? "pointer" : "not-allowed",
                background: active ? sbActiveBg : "transparent",
                marginBottom: "2px", transition: "background 0.15s",
                opacity: app.live ? 1 : 0.4,
              }}
              onMouseEnter={(e) => { if (!active && app.live) e.currentTarget.style.background = sbHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = active ? sbActiveBg : "transparent"; }}
            >
              <AppIcon name={app.icon} size={18} color={active ? sbActive : sbText} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? sbActive : sbText, display: "block" }}>
                  {app.name}
                </span>
              </div>
              {!app.live && (
                <span style={{
                  fontSize: "9px", fontWeight: 700, color: "rgba(155,163,175,0.6)",
                  background: "rgba(255,255,255,0.06)", borderRadius: "0", padding: "2px 5px",
                  textTransform: "uppercase", letterSpacing: "0.4px",
                }}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage bar */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: sbText }}>Arc Drive</span>
            <span style={{ fontSize: "10px", color: "rgba(155,163,175,0.6)" }}>{fileCount}/{STORAGE_LIMIT}</span>
          </div>
          <div style={{ height: "4px", borderRadius: "0", overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
            <div style={{
              width: `${Math.min((fileCount / STORAGE_LIMIT) * 100, 100)}%`,
              height: "100%", borderRadius: "0",
              background: `linear-gradient(90deg, ${ARC_BLUE}, #4f46e5)`,
              transition: "width 0.3s",
            }} />
          </div>
          <p style={{ fontSize: "10px", color: "rgba(155,163,175,0.45)", margin: "6px 0 0" }}>
            {fileCount} of {STORAGE_LIMIT} files used
          </p>
        </div>
        <p style={{ fontSize: "10px", color: "rgba(155,163,175,0.35)", margin: "8px 0 0" }}>Arc Studio v1.0</p>
      </div>
    </aside>
  );
}

function ComingSoon({ name, isDark, onBack }: { name: string; isDark: boolean; onBack: () => void }) {
  const bg = isDark ? "#0f1419" : "#f7f9fc";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontFamily: "'Open Sans',Arial,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: textPrimary, margin: "0 0 8px" }}>{name} is coming soon</h2>
        <p style={{ fontSize: "14px", color: textSecondary, marginBottom: "24px" }}>
          This app is part of the Arc Studio suite and will be available soon.
        </p>
        <button onClick={onBack} style={{
          padding: "10px 24px", fontSize: "14px", fontWeight: 600, color: "#fff",
          background: ARC_BLUE, border: "none", borderRadius: "0", cursor: "pointer",
        }}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { session, loading } = useAuth();
  const { needsSetup, loading: wsLoading } = useWorkspace();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [currentApp, setCurrentApp] = useState<AppId>("home");
  const [isDark, setIsDark] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showPing, setShowPing] = useState(false);
  const [showSlate, setShowSlate] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    applyMode(isDark ? Mode.Dark : Mode.Light);
  }, [isDark]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { count } = await supabase.from("files").select("*", { count: "exact", head: true });
      setFileCount(count ?? 0);
    })();
  }, [session, currentApp]);

  if (loading || wsLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f7f9fc", fontFamily: "'Open Sans',Arial,sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px", height: "40px", border: "3px solid #ebebf0",
            borderTopColor: ARC_BLUE, borderRadius: "50%",
            margin: "0 auto 16px", animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#656871", fontSize: "14px" }}>Loading Arc Studio...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!session) {
    return authView === "login"
      ? <LoginScreen onSwitchToSignUp={() => setAuthView("signup")} />
      : <SignUpScreen onSwitchToLogin={() => setAuthView("login")} />;
  }

  if (needsSetup && !setupDone) {
    return <SetupWizard onComplete={() => setSetupDone(true)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <AppHeader
        currentApp={currentApp}
        onNavigate={setCurrentApp}
        onOpenPing={() => setShowPing(true)}
        onOpenSlate={() => setShowSlate(true)}
        isDark={isDark}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <WorkspaceRail
          currentApp={currentApp}
          onNavigate={setCurrentApp}
          onOpenSettings={() => setShowSettings(true)}
          isDark={isDark}
        />
        <Sidebar currentApp={currentApp} onNavigate={setCurrentApp} isDark={isDark} fileCount={fileCount} />

        <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {currentApp === "home"   && <HomeScreen  onNavigate={setCurrentApp} isDark={isDark} />}
          {currentApp === "drive"  && <DriveScreen onNavigate={setCurrentApp} isDark={isDark} />}
          {currentApp === "paper"  && <PaperScreen isDark={isDark} />}
          {currentApp === "ping"   && <PingScreen  isDark={isDark} />}
          {currentApp === "slate"  && <SlateScreen isDark={isDark} />}
          {currentApp === "editor" && <ComingSoon name="Loom Editor" isDark={isDark} onBack={() => setCurrentApp("home")} />}
          {currentApp === "sign"   && <ComingSoon name="Loom Sign"   isDark={isDark} onBack={() => setCurrentApp("home")} />}
        </main>
      </div>

      {showSettings && <SettingsPanel isDark={isDark} onToggleDark={() => setIsDark((v) => !v)} onClose={() => setShowSettings(false)} />}
      {showPing && <PingWindow isDark={isDark} onClose={() => setShowPing(false)} />}
      {showSlate && <SlateWindow isDark={isDark} onClose={() => setShowSlate(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGateWithWorkspace />
    </AuthProvider>
  );
}

function AuthGateWithWorkspace() {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f7f9fc", fontFamily: "'Open Sans',Arial,sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px", height: "40px", border: "3px solid #ebebf0",
            borderTopColor: ARC_BLUE, borderRadius: "50%",
            margin: "0 auto 16px", animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "#656871", fontSize: "14px" }}>Loading Arc Studio...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <WorkspaceProvider session={session} user={user}>
      <MainApp />
    </WorkspaceProvider>
  );
}
