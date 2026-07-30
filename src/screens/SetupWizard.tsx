import { useState, type FormEvent } from "react";
import { useWorkspace } from "../lib/workspace";
import { ARC_BLUE } from "../components/AppHeader";

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const { createWorkspace, addMember } = useWorkspace();
  const [step, setStep] = useState(0);
  const [wsName, setWsName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");
  const [members, setMembers] = useState<{ email: string; role: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdWsId, setCreatedWsId] = useState<string | null>(null);

  const steps = ["Name your workspace", "Invite your team", "Review & finish"];

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const ws = await createWorkspace(wsName.trim());
    if (!ws) {
      setError("Could not create workspace. Please try again.");
      setLoading(false);
      return;
    }
    setCreatedWsId(ws.id);
    setLoading(false);
    setStep(1);
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim() || !createdWsId) return;
    setLoading(true);
    setError(null);
    const { error } = await addMember(memberEmail.trim(), memberRole);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setMembers([...members, { email: memberEmail.trim(), role: memberRole }]);
    setMemberEmail("");
  };

  const finish = () => {
    onComplete();
  };

  const bg = "#f7f9fc";
  const cardBg = "#fff";
  const border = "#ebebf0";
  const textPrimary = "#1a1a2e";
  const textSecondary = "#656871";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: bg, fontFamily: "'Open Sans','Helvetica Neue',Arial,sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: "480px", padding: "40px" }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px", justifyContent: "center" }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? "32px" : "8px", height: "8px", borderRadius: "4px",
              background: i <= step ? ARC_BLUE : "#d4d7e0", transition: "all 0.2s",
            }} />
          ))}
        </div>

        <div style={{
          background: cardBg, border: `1px solid ${border}`, borderRadius: "0",
          padding: "32px",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: ARC_BLUE, textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 8px" }}>
            Step {step + 1} of {steps.length}
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: textPrimary, margin: "0 0 4px" }}>
            {steps[step]}
          </h1>
          <p style={{ fontSize: "14px", color: textSecondary, margin: "0 0 24px" }}>
            {step === 0 && "Give your workspace a name. This is how your team will identify it."}
            {step === 1 && "Invite team members by email. You can add more later."}
            {step === 2 && "Review your setup. You can change everything later in Settings."}
          </p>

          {error && (
            <div style={{
              padding: "10px 14px", marginBottom: "16px",
              background: "#fff5f5", border: "1px solid #db0000",
              fontSize: "13px", color: "#db0000",
            }}>
              {error}
            </div>
          )}

          {/* Step 0: Workspace name */}
          {step === 0 && (
            <>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textPrimary, marginBottom: "6px" }}>
                Workspace name
              </label>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g. Acme Creative"
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", fontSize: "14px",
                  border: `1px solid ${border}`, borderRadius: "0",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
                onBlur={(e) => (e.target.style.borderColor = border)}
              />
              <button
                onClick={handleCreate}
                disabled={!wsName.trim() || loading}
                style={{
                  width: "100%", marginTop: "20px", padding: "12px",
                  fontSize: "14px", fontWeight: 700, color: "#fff",
                  background: ARC_BLUE, border: "none", borderRadius: "0",
                  cursor: !wsName.trim() || loading ? "not-allowed" : "pointer",
                  opacity: !wsName.trim() || loading ? 0.5 : 1,
                }}
              >
                {loading ? "Creating..." : "Continue"}
              </button>
            </>
          )}

          {/* Step 1: Invite members */}
          {step === 1 && (
            <>
              <form onSubmit={handleAddMember}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    style={{
                      flex: 1, padding: "10px 14px", fontSize: "14px",
                      border: `1px solid ${border}`, borderRadius: "0",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as "admin" | "member")}
                    style={{
                      padding: "10px 14px", fontSize: "14px",
                      border: `1px solid ${border}`, borderRadius: "0",
                      outline: "none", background: "#fff",
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!memberEmail.trim() || loading}
                    style={{
                      padding: "10px 20px", fontSize: "14px", fontWeight: 600,
                      color: "#fff", background: ARC_BLUE, border: "none",
                      borderRadius: "0", cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    Invite
                  </button>
                </div>
              </form>

              {members.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  {members.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0", borderBottom: `1px solid ${border}`,
                    }}>
                      <span style={{ fontSize: "13px", color: textPrimary }}>{m.email}</span>
                      <span style={{ fontSize: "12px", color: textSecondary, textTransform: "capitalize" }}>{m.role}</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: "12px", color: textSecondary, marginBottom: "16px" }}>
                You are the admin of this workspace. You can invite more members later.
              </p>

              <button
                onClick={() => setStep(2)}
                style={{
                  width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700,
                  color: "#fff", background: ARC_BLUE, border: "none",
                  borderRadius: "0", cursor: "pointer",
                }}
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: "12px", color: textSecondary }}>Workspace</span>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: textPrimary, margin: "4px 0 0" }}>{wsName}</p>
                </div>
                <div style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: "12px", color: textSecondary }}>Members</span>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: textPrimary, margin: "4px 0 0" }}>
                    {members.length + 1} total (you + {members.length} invited)
                  </p>
                </div>
                <div style={{ padding: "12px 0" }}>
                  <span style={{ fontSize: "12px", color: textSecondary }}>Your role</span>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: textPrimary, margin: "4px 0 0" }}>Admin</p>
                </div>
              </div>

              <button
                onClick={finish}
                style={{
                  width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700,
                  color: "#fff", background: ARC_BLUE, border: "none",
                  borderRadius: "0", cursor: "pointer",
                }}
              >
                Enter Arc Studio
              </button>
            </>
          )}
        </div>

        {/* Back link */}
        {step > 0 && step < 2 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              marginTop: "16px", background: "none", border: "none",
              color: ARC_BLUE, fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
