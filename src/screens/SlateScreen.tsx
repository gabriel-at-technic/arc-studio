import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { ARC_BLUE } from "../components/AppHeader";

type Asset = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  content: string | null;
  editable: boolean;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  picture: "Picture",
  text: "Text",
  diagram: "Diagram",
  pdf: "PDF",
  page: "Page",
};

const TYPE_COLORS: Record<string, string> = {
  picture: "#006ce0",
  text: "#00802f",
  diagram: "#7300e5",
  pdf: "#db0000",
  page: "#4f46e5",
};

export default function SlateScreen({ isDark }: { isDark: boolean }) {
  const { currentWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);

  const bg = isDark ? "#0f1419" : "#f7f9fc";
  const panelBg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";

  const fetchAssets = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data } = await supabase
      .from("assets")
      .select("id, name, type, url, content, editable, created_at")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false });
    setAssets((data as Asset[]) ?? []);
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filtered = filter === "all" ? assets : assets.filter((a) => a.type === filter);

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    setDraggedAsset(asset);
    e.dataTransfer.setData("application/json", JSON.stringify(asset));
    e.dataTransfer.effectAllowed = "copy";
  };

  if (!currentWorkspace) {
    return <div style={{ padding: "40px", color: textSecondary, fontFamily: "'Open Sans',Arial,sans-serif" }}>No workspace selected.</div>;
  }

  return (
    <div style={{ background: bg, minHeight: "100%", padding: "32px 40px", fontFamily: "'Open Sans',Arial,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: textPrimary, margin: 0 }}>Arc Slate</h1>
          <p style={{ fontSize: "14px", color: textSecondary, marginTop: "4px" }}>
            Workspace asset gallery for {currentWorkspace.name}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: "10px 20px", fontSize: "14px", fontWeight: 600,
            color: "#fff", background: ARC_BLUE, border: "none",
            borderRadius: "0", cursor: "pointer",
          }}
        >
          + Add Asset
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: `1px solid ${border}` }}>
        {["all", "picture", "text", "diagram", "pdf", "page"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "8px 16px", fontSize: "13px", fontWeight: 600,
              border: "none", background: "transparent", cursor: "pointer",
              color: filter === t ? ARC_BLUE : textSecondary,
              borderBottom: `2px solid ${filter === t ? ARC_BLUE : "transparent"}`,
              marginBottom: "-1px", textTransform: "capitalize",
            }}
          >
            {t === "all" ? "All Assets" : TYPE_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      {loading ? (
        <p style={{ color: textSecondary, fontSize: "14px" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: "60px 24px", background: panelBg,
          border: `1px solid ${border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: "14px", color: textSecondary, margin: "0 0 16px" }}>
            No assets yet. Add pictures, text, diagrams, PDFs, or pages to your workspace gallery.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "10px 24px", fontSize: "14px", fontWeight: 600,
              color: "#fff", background: ARC_BLUE, border: "none",
              borderRadius: "0", cursor: "pointer",
            }}
          >
            Add Asset
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {filtered.map((asset) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, asset)}
              style={{
                background: panelBg, border: `1px solid ${border}`,
                cursor: "grab", display: "flex", flexDirection: "column",
              }}
            >
              {/* Asset preview */}
              <div style={{
                height: "140px", display: "flex", alignItems: "center", justifyContent: "center",
                background: `${TYPE_COLORS[asset.type] ?? "#656871"}08`,
                borderBottom: `1px solid ${border}`,
                overflow: "hidden",
              }}>
                {asset.type === "picture" && asset.url ? (
                  <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "0",
                    background: `${TYPE_COLORS[asset.type] ?? "#656871"}15`,
                    display: "grid", placeItems: "center",
                  }}>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: TYPE_COLORS[asset.type] ?? "#656871" }}>
                      {TYPE_LABELS[asset.type]?.[0] ?? "A"}
                    </span>
                  </div>
                )}
              </div>
              {/* Asset info */}
              <div style={{ padding: "12px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {asset.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                  <span style={{
                    fontSize: "10px", fontWeight: 600,
                    color: TYPE_COLORS[asset.type] ?? "#656871",
                    textTransform: "uppercase", letterSpacing: "0.4px",
                  }}>
                    {TYPE_LABELS[asset.type] ?? asset.type}
                  </span>
                  {asset.editable && (
                    <span style={{
                      fontSize: "10px", fontWeight: 600, color: ARC_BLUE,
                      background: `${ARC_BLUE}15`, padding: "2px 6px",
                    }}>
                      Editable
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add asset modal */}
      {showAdd && (
        <AddAssetModal
          isDark={isDark}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchAssets(); }}
          workspaceId={currentWorkspace.id}
        />
      )}
    </div>
  );
}

function AddAssetModal({
  isDark,
  onClose,
  onAdded,
  workspaceId,
}: {
  isDark: boolean;
  onClose: () => void;
  onAdded: () => void;
  workspaceId: string;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("picture");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("assets").insert({
      workspace_id: workspaceId,
      name: name.trim(),
      type,
      url: url.trim() || null,
      content: content.trim() || null,
      editable,
    });
    setLoading(false);
    if (error) setError(error.message);
    else onAdded();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(0,0,0,0.3)", display: "grid", placeItems: "center",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "420px", background: bg, border: `1px solid ${border}`,
          padding: "28px", fontFamily: "'Open Sans',Arial,sans-serif",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: textPrimary, margin: "0 0 20px" }}>Add Asset</h3>
        {error && (
          <div style={{ padding: "10px 14px", marginBottom: "16px", background: "#fff5f5", border: "1px solid #db0000", fontSize: "13px", color: "#db0000" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textPrimary, marginBottom: "6px" }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Asset name"
            autoFocus
            style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1px solid ${border}`, borderRadius: "0", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
          />

          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textPrimary, marginBottom: "6px" }}>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1px solid ${border}`, borderRadius: "0", background: bg, color: textPrimary, marginBottom: "16px" }}
          >
            <option value="picture">Picture</option>
            <option value="text">Text</option>
            <option value="diagram">Diagram</option>
            <option value="pdf">PDF</option>
            <option value="page">Page</option>
          </select>

          {type === "picture" && (
            <>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textPrimary, marginBottom: "6px" }}>Image URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1px solid ${border}`, borderRadius: "0", outline: "none", boxSizing: "border-box", marginBottom: "16px" }}
              />
            </>
          )}

          {(type === "text" || type === "diagram") && (
            <>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: textPrimary, marginBottom: "6px" }}>Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content..."
                rows={4}
                style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: `1px solid ${border}`, borderRadius: "0", outline: "none", boxSizing: "border-box", marginBottom: "16px", resize: "vertical" }}
              />
            </>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: textPrimary, marginBottom: "20px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={editable}
              onChange={(e) => setEditable(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Make editable
          </label>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, color: textPrimary, background: isDark ? "#0f1419" : "#f0f2f5", border: "none", borderRadius: "0", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, color: "#fff", background: ARC_BLUE, border: "none", borderRadius: "0", cursor: loading ? "not-allowed" : "pointer", opacity: loading || !name.trim() ? 0.5 : 1 }}
            >
              {loading ? "Adding..." : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
