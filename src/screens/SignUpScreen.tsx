import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";

const ARC_BLUE = "#2f74f6";

export default function SignUpScreen({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${ARC_BLUE}11 0%, #f7f9fc 50%, ${ARC_BLUE}08 100%)`,
        fontFamily: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "48px 40px",
          background: "#fff",
          borderRadius: "0",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img src="/arc-studio-logo.webp" alt="Arc Studio" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#1a1a2e",
                letterSpacing: "-0.5px",
              }}
            >
              Arc <span style={{ color: ARC_BLUE }}>ID</span>
            </span>
          </div>
          <p
            style={{
              marginTop: "12px",
              fontSize: "14px",
              color: "#656871",
            }}
          >
            Create your Arc ID account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="displayName"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a1a2e",
                marginBottom: "6px",
              }}
            >
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "14px",
                border: "1px solid #b4b4bb",
                borderRadius: "0",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
              onBlur={(e) => (e.target.style.borderColor = "#b4b4bb")}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a1a2e",
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "14px",
                border: "1px solid #b4b4bb",
                borderRadius: "0",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
              onBlur={(e) => (e.target.style.borderColor = "#b4b4bb")}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a1a2e",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "14px",
                border: "1px solid #b4b4bb",
                borderRadius: "0",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
              onBlur={(e) => (e.target.style.borderColor = "#b4b4bb")}
            />
            <p
              style={{
                marginTop: "6px",
                fontSize: "12px",
                color: "#8c8c94",
              }}
            >
              At least 6 characters
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                marginBottom: "20px",
                background: "#fff5f5",
                border: "1px solid #db0000",
                borderRadius: "0",
                fontSize: "13px",
                color: "#db0000",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              background: ARC_BLUE,
              border: "none",
              borderRadius: "0",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.15s, opacity 0.15s",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#656871",
          }}
        >
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            style={{
              background: "none",
              border: "none",
              color: ARC_BLUE,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "13px",
              padding: 0,
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
