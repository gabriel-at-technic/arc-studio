import { useState } from "react";
import { useWorkspace } from "../lib/workspace";
import { ARC_BLUE, AppIcon, type AppId } from "./AppHeader";

export function SettingsPanel({
  isDark,
  onToggleDark,
  onClose,
}: {
  isDark: boolean;
  onToggleDark: () => void;
  onClose: () => void;
}) {
  const { currentWorkspace, members, removeMember, updateMemberRole, addMember } = useWorkspace();

  const bg = "#fff";
  const border = "#ebebf0";
  const textPrimary = "#1a1a2e";
  const textSecondary = "#656871";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,0.3)",
      display: "flex", justifyContent: "flex-end",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "400px", height: "100%", background: bg,
          borderLeft: `1px solid ${border}`,
          overflow: "auto", fontFamily: "'Open Sans',Arial,sans-serif",
        }}
      >
        <div style={{
          padding: "20px", borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: textPrimary, margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: "20px", color: textSecondary, padding: "4px",
          }}>x</button>
        </div>

        {/* Display mode */}
        <div style={{ padding: "20px", borderBottom: `1px solid ${border}` }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: textPrimary, margin: "0 0 12px" }}>Display</h3>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px", border: `1px solid ${border}`,
          }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: textPrimary, margin: 0 }}>Display mode</p>
              <p style={{ fontSize: "12px", color: textSecondary, margin: "4px 0 0" }}>
                {isDark ? "Dark" : "Light"}
              </p>
            </div>
            <button
              onClick={onToggleDark}
              style={{
                width: "48px", height: "24px", borderRadius: "12px",
                background: isDark ? ARC_BLUE : "#d4d7e0",
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                position: "absolute", top: "2px",
                left: isDark ? "26px" : "2px",
                width: "20px", height: "20px", borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
              }} />
            </button>
          </div>
        </div>

        {/* Workspace info */}
        {currentWorkspace && (
          <div style={{ padding: "20px", borderBottom: `1px solid ${border}` }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: textPrimary, margin: "0 0 12px" }}>Workspace</h3>
            <p style={{ fontSize: "13px", color: textPrimary, margin: "0 0 4px" }}>{currentWorkspace.name}</p>
            <p style={{ fontSize: "12px", color: textSecondary, margin: "0" }}>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Members */}
        {currentWorkspace && (
          <div style={{ padding: "20px", borderBottom: `1px solid ${border}` }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: textPrimary, margin: "0 0 12px" }}>Members</h3>
            {members.map((m) => (
              <div key={m.user_id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 0", borderBottom: `1px solid ${border}`,
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
                  color: "#fff", display: "grid", placeItems: "center",
                  fontSize: "12px", fontWeight: 700, flexShrink: 0,
                }}>
                  {(m.profile?.display_name || m.profile?.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.profile?.display_name ?? "Unknown"}
                  </p>
                  <p style={{ fontSize: "11px", color: textSecondary, margin: "0" }}>{m.profile?.email}</p>
                </div>
                <select
                  value={m.role}
                  onChange={(e) => updateMemberRole(m.user_id, e.target.value as "admin" | "member")}
                  style={{
                    fontSize: "12px", padding: "4px 8px",
                    border: `1px solid ${border}`, background: "#fff",
                    borderRadius: "0", cursor: "pointer",
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => removeMember(m.user_id)}
                  style={{
                    border: "none", background: "none", cursor: "pointer",
                    color: "#db0000", fontSize: "16px", padding: "4px",
                  }}
                  title="Remove member"
                >x</button>
              </div>
            ))}
            <AddMemberForm onAdd={addMember} />
          </div>
        )}
      </div>
    </div>
  );
}

function AddMemberForm({ onAdd }: { onAdd: (email: string, role: "admin" | "member") => Promise<{ error: string | null }> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await onAdd(email.trim(), role);
    setLoading(false);
    if (error) setError(error);
    else setEmail("");
  };

  return (
    <form onSubmit={handleAdd} style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          style={{
            flex: 1, padding: "8px 12px", fontSize: "13px",
            border: `1px solid #ebebf0`, borderRadius: "0", outline: "none",
          }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "member")}
          style={{ padding: "8px", fontSize: "13px", border: `1px solid #ebebf0`, borderRadius: "0", background: "#fff" }}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading || !email.trim()} style={{
          padding: "8px 16px", fontSize: "13px", fontWeight: 600,
          color: "#fff", background: ARC_BLUE, border: "none", borderRadius: "0",
          cursor: "pointer",
        }}>
          Add
        </button>
      </div>
      {error && <p style={{ fontSize: "12px", color: "#db0000", margin: "8px 0 0" }}>{error}</p>}
    </form>
  );
}
