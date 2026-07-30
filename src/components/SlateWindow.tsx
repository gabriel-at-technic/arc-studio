import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { ARC_BLUE, AppIcon } from "./AppHeader";

type Asset = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  content: string | null;
  editable: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  picture: "#006ce0", text: "#00802f", diagram: "#7300e5", pdf: "#db0000", page: "#4f46e5",
};

export function SlateWindow({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const { currentWorkspace } = useWorkspace();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState("all");
  const [pos, setPos] = useState({ x: 140, y: 100 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const bg = isDark ? "#0f1419" : "#fff";
  const panelBg = isDark ? "#1a1f26" : "#f7f9fc";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";

  const fetchAssets = useCallback(async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase
      .from("assets")
      .select("id, name, type, url, content, editable")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false });
    setAssets((data as Asset[]) ?? []);
  }, [currentWorkspace]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const filtered = filter === "all" ? assets : assets.filter((a) => a.type === filter);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, []);

  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, zIndex: 350,
      width: "340px", height: "440px", background: bg,
      border: `1px solid ${border}`, display: "flex", flexDirection: "column",
      fontFamily: "'Open Sans',Arial,sans-serif",
    }}>
      {/* Title bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: "10px 14px", background: panelBg, borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "move", userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AppIcon name="slate" size={18} color={textPrimary} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: textPrimary }}>Arc Slate</span>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "16px", color: textSecondary, padding: "4px" }}>x</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "2px", padding: "6px 8px", borderBottom: `1px solid ${border}`, overflowX: "auto" }}>
        {["all", "picture", "text", "diagram", "pdf", "page"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: "3px 8px", fontSize: "11px", fontWeight: 600, border: "none",
            background: filter === t ? `${ARC_BLUE}15` : "transparent",
            color: filter === t ? ARC_BLUE : textSecondary,
            borderRadius: "0", cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize",
          }}>
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px" }}>
        {filtered.length === 0 ? (
          <p style={{ color: textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>
            No assets. Drag these into your project.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {filtered.map((asset) => (
              <div
                key={asset.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(asset));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                style={{
                  border: `1px solid ${border}`, background: panelBg,
                  cursor: "grab", padding: "8px", display: "flex",
                  flexDirection: "column", gap: "6px",
                }}
              >
                <div style={{
                  height: "60px", display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${TYPE_COLORS[asset.type] ?? "#656871"}08`,
                }}>
                  {asset.type === "picture" && asset.url ? (
                    <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "16px", fontWeight: 700, color: TYPE_COLORS[asset.type] ?? "#656871" }}>
                      {asset.type[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "11px", fontWeight: 600, color: textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {asset.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${border}`, background: panelBg }}>
        <p style={{ fontSize: "11px", color: textSecondary, margin: 0, textAlign: "center" }}>
          Drag assets into your document
        </p>
      </div>
    </div>
  );
}
