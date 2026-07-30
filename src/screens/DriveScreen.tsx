import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { ARC_BLUE, type AppId } from "../components/AppHeader";

type FileRow = {
  id: string;
  name: string;
  type: string;
  source_app: string;
  storage_path: string | null;
  content: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
};

const TABS: { id: string; label: string; types: string[] }[] = [
  { id: "all", label: "All Files", types: [] },
  { id: "documents", label: "Documents", types: ["document"] },
  { id: "pdfs", label: "PDFs", types: ["pdf"] },
  { id: "signatures", label: "Signatures", types: ["signature"] },
  { id: "assets", label: "Saved Assets", types: ["asset"] },
];

export default function DriveScreen({
  onNavigate,
  isDark,
}: {
  onNavigate: (app: AppId) => void;
  isDark: boolean;
}) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<FileRow | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("files")
      .select("*")
      .order("created_at", { ascending: false });
    setFiles((data as FileRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filtered = files.filter((f) => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (tab && tab.types.length > 0 && !tab.types.includes(f.type)) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleRename = async (file: FileRow) => {
    if (!renameValue.trim()) return;
    await supabase.from("files").update({ name: renameValue.trim(), updated_at: new Date().toISOString() }).eq("id", file.id);
    setRenameId(null);
    setRenameValue("");
    fetchFiles();
  };

  const handleDelete = async (file: FileRow) => {
    await supabase.from("files").delete().eq("id", file.id);
    setDeleteConfirm(null);
    setSelected((s) => s.filter((id) => id !== file.id));
    fetchFiles();
  };

  const handleDownload = (file: FileRow) => {
    const content = file.content ?? "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const bg = isDark ? "#0f1419" : "#f7f9fc";
  const cardBg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";
  const hoverBg = isDark ? "#0f1419" : "#f0f2f5";

  return (
    <div style={{ background: bg, minHeight: "calc(100vh - 56px)", fontFamily: "'Open Sans', 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 48px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: textPrimary, margin: 0 }}>Arc Drive</h1>
            <p style={{ fontSize: "14px", color: textSecondary, marginTop: "4px" }}>
              All your files across every Arc app
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setViewMode("table")}
              style={{
                width: "36px",
                height: "36px",
                border: `1px solid ${viewMode === "table" ? ARC_BLUE : border}`,
                background: viewMode === "table" ? `${ARC_BLUE}15` : "transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4 H14 M2 8 H14 M2 12 H14" stroke={viewMode === "table" ? ARC_BLUE : textSecondary} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                width: "36px",
                height: "36px",
                border: `1px solid ${viewMode === "grid" ? ARC_BLUE : border}`,
                background: viewMode === "grid" ? `${ARC_BLUE}15` : "transparent",
                borderRadius: "8px",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke={viewMode === "grid" ? ARC_BLUE : textSecondary} strokeWidth="1.5" fill="none" />
                <rect x="9" y="2" width="5" height="5" rx="1" stroke={viewMode === "grid" ? ARC_BLUE : textSecondary} strokeWidth="1.5" fill="none" />
                <rect x="2" y="9" width="5" height="5" rx="1" stroke={viewMode === "grid" ? ARC_BLUE : textSecondary} strokeWidth="1.5" fill="none" />
                <rect x="9" y="9" width="5" height="5" rx="1" stroke={viewMode === "grid" ? ARC_BLUE : textSecondary} strokeWidth="1.5" fill="none" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="7" cy="7" r="5" stroke={textSecondary} strokeWidth="1.5" fill="none" />
              <path d="M11 11 L14 14" stroke={textSecondary} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 38px",
                fontSize: "14px",
                border: `1px solid ${border}`,
                borderRadius: "8px",
                background: cardBg,
                color: textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
              onBlur={(e) => (e.target.style.borderColor = border)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: `1px solid ${border}`, paddingBottom: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: activeTab === tab.id ? ARC_BLUE : textSecondary,
                borderBottom: `2px solid ${activeTab === tab.id ? ARC_BLUE : "transparent"}`,
                marginBottom: "-1px",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: textSecondary, fontSize: "14px" }}>Loading files...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState isDark={isDark} onGoHome={() => onNavigate("home")} />
        ) : viewMode === "table" ? (
          <FileTable
            files={filtered}
            isDark={isDark}
            selected={selected}
            toggleSelect={toggleSelect}
            renameId={renameId}
            renameValue={renameValue}
            setRenameId={setRenameId}
            setRenameValue={setRenameValue}
            handleRename={handleRename}
            handleDownload={handleDownload}
            setDeleteConfirm={setDeleteConfirm}
          />
        ) : (
          <FileGrid
            files={filtered}
            isDark={isDark}
            handleDownload={handleDownload}
            setRenameId={setRenameId}
            setRenameValue={setRenameValue}
            setDeleteConfirm={setDeleteConfirm}
          />
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 300,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "400px",
              background: cardBg,
              borderRadius: "0",
              padding: "28px",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: textPrimary, margin: "0 0 12px" }}>
              Delete file?
            </h3>
            <p style={{ fontSize: "14px", color: textSecondary, margin: "0 0 24px" }}>
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: textPrimary,
                  background: isDark ? "#0f1419" : "#f0f2f5",
                  border: "none",
                  borderRadius: "0",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#fff",
                  background: "#db0000",
                  border: "none",
                  borderRadius: "0",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ isDark, onGoHome }: { isDark: boolean; onGoHome: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div
        style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 20px",
          borderRadius: "20px",
          background: isDark ? "#1a1f26" : "#f0f2f5",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M10 26 L18 12 H22 L30 26 Z" stroke={ARC_BLUE} strokeWidth="2" strokeLinejoin="round" fill="none" />
          <circle cx="20" cy="22" r="2.5" fill={ARC_BLUE} />
        </svg>
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: 700, color: isDark ? "#e6e6e6" : "#1a1a2e", margin: "0 0 8px" }}>
        No files yet
      </h3>
      <p style={{ fontSize: "14px", color: isDark ? "#8c8c94" : "#656871", margin: "0 0 24px", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
        Files you create in Loom Paper, Loom Editor, or Loom Sign will appear here automatically.
      </p>
      <button
        onClick={onGoHome}
        style={{
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#fff",
          background: ARC_BLUE,
          border: "none",
          borderRadius: "0",
          cursor: "pointer",
        }}
      >
        Back to Home
      </button>
    </div>
  );
}

function FileTable({
  files,
  isDark,
  selected,
  toggleSelect,
  renameId,
  renameValue,
  setRenameId,
  setRenameValue,
  handleRename,
  handleDownload,
  setDeleteConfirm,
}: {
  files: FileRow[];
  isDark: boolean;
  selected: string[];
  toggleSelect: (id: string) => void;
  renameId: string | null;
  renameValue: string;
  setRenameId: (id: string | null) => void;
  setRenameValue: (v: string) => void;
  handleRename: (f: FileRow) => void;
  handleDownload: (f: FileRow) => void;
  setDeleteConfirm: (f: FileRow) => void;
}) {
  const cardBg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";
  const rowHover = isDark ? "#0f1419" : "#f7f9fc";

  return (
    <div style={{ background: cardBg, borderRadius: "0", border: `1px solid ${border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            <th style={{ width: "40px", padding: "12px", textAlign: "left" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary }}>#</span>
            </th>
            <th style={{ padding: "12px", textAlign: "left" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</span>
            </th>
            <th style={{ padding: "12px", textAlign: "left", width: "120px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Type</span>
            </th>
            <th style={{ padding: "12px", textAlign: "left", width: "120px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Source</span>
            </th>
            <th style={{ padding: "12px", textAlign: "left", width: "140px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</span>
            </th>
            <th style={{ padding: "12px", textAlign: "right", width: "120px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.id}
              style={{ borderBottom: `1px solid ${border}`, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = rowHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "12px" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(file.id)}
                  onChange={() => toggleSelect(file.id)}
                  style={{ cursor: "pointer" }}
                />
              </td>
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileIcon type={file.type} />
                  {renameId === file.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(file)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(file)}
                      autoFocus
                      style={{
                        padding: "4px 8px",
                        fontSize: "14px",
                        border: `1px solid ${ARC_BLUE}`,
                        borderRadius: "6px",
                        outline: "none",
                        background: isDark ? "#0f1419" : "#fff",
                        color: textPrimary,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "14px", fontWeight: 600, color: textPrimary }}>{file.name}</span>
                  )}
                </div>
              </td>
              <td style={{ padding: "12px" }}>
                <TypeBadge type={file.type} />
              </td>
              <td style={{ padding: "12px" }}>
                <span style={{ fontSize: "13px", color: textSecondary, textTransform: "capitalize" }}>{file.source_app}</span>
              </td>
              <td style={{ padding: "12px" }}>
                <span style={{ fontSize: "13px", color: textSecondary }}>{new Date(file.created_at).toLocaleDateString()}</span>
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <ActionButton title="Download" onClick={() => handleDownload(file)} isDark={isDark}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2 V11 M4 7 L8 11 L12 7 M3 14 H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </ActionButton>
                  <ActionButton
                    title="Rename"
                    onClick={() => {
                      setRenameId(file.id);
                      setRenameValue(file.name);
                    }}
                    isDark={isDark}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 12 L2 14 L4 14 L12 6 L10 4 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    </svg>
                  </ActionButton>
                  <ActionButton title="Delete" onClick={() => setDeleteConfirm(file)} isDark={isDark} danger>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 5 H13 M6 5 V3 H10 V5 M5 5 L6 14 H10 L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FileGrid({
  files,
  isDark,
  handleDownload,
  setRenameId,
  setRenameValue,
  setDeleteConfirm,
}: {
  files: FileRow[];
  isDark: boolean;
  handleDownload: (f: FileRow) => void;
  setRenameId: (id: string) => void;
  setRenameValue: (v: string) => void;
  setDeleteConfirm: (f: FileRow) => void;
}) {
  const cardBg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
      {files.map((file) => (
        <div
          key={file.id}
          style={{
            background: cardBg,
            borderRadius: "0",
            border: `1px solid ${border}`,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <FileIcon type={file.type} large />
            <div style={{ display: "flex", gap: "4px" }}>
              <ActionButton title="Download" onClick={() => handleDownload(file)} isDark={isDark}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2 V11 M4 7 L8 11 L12 7 M3 14 H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ActionButton>
              <ActionButton
                title="Rename"
                onClick={() => {
                  setRenameId(file.id);
                  setRenameValue(file.name);
                }}
                isDark={isDark}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 12 L2 14 L4 14 L12 6 L10 4 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                </svg>
              </ActionButton>
              <ActionButton title="Delete" onClick={() => setDeleteConfirm(file)} isDark={isDark} danger>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5 H13 M6 5 V3 H10 V5 M5 5 L6 14 H10 L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </ActionButton>
            </div>
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file.name}
            </p>
            <p style={{ fontSize: "12px", color: textSecondary, margin: "4px 0 0" }}>
              {file.source_app} · {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FileIcon({ type, large }: { type: string; large?: boolean }) {
  const colors: Record<string, string> = {
    document: "#006ce0",
    pdf: "#db0000",
    signature: "#7300e5",
    asset: "#00802f",
  };
  const c = colors[type] ?? "#656871";
  const size = large ? 40 : 28;
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "8px",
        background: `${c}15`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M6 3 H15 L19 7 V21 H6 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
        <path d="M15 3 V7 H19" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    document: "#006ce0",
    pdf: "#db0000",
    signature: "#7300e5",
    asset: "#00802f",
  };
  const labels: Record<string, string> = {
    document: "Document",
    pdf: "PDF",
    signature: "Signature",
    asset: "Asset",
  };
  const c = colors[type] ?? "#656871";
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: c,
        background: `${c}15`,
        padding: "3px 8px",
        borderRadius: "10px",
      }}
    >
      {labels[type] ?? type}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  isDark,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  isDark: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: "30px",
        height: "30px",
        border: "none",
        background: "transparent",
        borderRadius: "6px",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: danger ? "#db0000" : isDark ? "#8c8c94" : "#656871",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? "#0f1419" : "#f0f2f5";
        if (!danger) e.currentTarget.style.color = isDark ? "#e6e6e6" : "#1a1a2e";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger ? "#db0000" : isDark ? "#8c8c94" : "#656871";
      }}
    >
      {children}
    </button>
  );
}
