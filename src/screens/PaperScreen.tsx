import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { ARC_BLUE } from "../components/AppHeader";

type Doc = {
  id: string;
  title: string;
  content: string | null;
  updated_at: string;
};

export default function PaperScreen({ isDark }: { isDark: boolean }) {
  const { currentWorkspace } = useWorkspace();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, title, content, updated_at")
      .eq("workspace_id", currentWorkspace.id)
      .order("updated_at", { ascending: false });
    setDocs((data as Doc[]) ?? []);
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const createDoc = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase
      .from("documents")
      .insert({ workspace_id: currentWorkspace.id, title: "Untitled", content: "" })
      .select("id, title, content, updated_at")
      .single();
    if (data) {
      const doc = data as Doc;
      setDocs([doc, ...docs]);
      openDoc(doc);
    }
  };

  const openDoc = (doc: Doc) => {
    setActiveDoc(doc);
    setTitle(doc.title);
    setContent(doc.content ?? "");
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content ?? "";
    }
  };

  const saveDoc = useCallback(async () => {
    if (!activeDoc) return;
    setSaving(true);
    await supabase
      .from("documents")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", activeDoc.id);
    setSaving(false);
    fetchDocs();
  }, [activeDoc, title, content, fetchDocs]);

  // Auto-save with debounce
  useEffect(() => {
    if (!activeDoc) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDoc(), 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, activeDoc, saveDoc]);

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Formatting commands
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) setContent(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  const bg = isDark ? "#0f1419" : "#f7f9fc";
  const panelBg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";
  const hoverBg = isDark ? "#0f1419" : "#f0f2f5";

  if (!currentWorkspace) {
    return <div style={{ padding: "40px", color: textSecondary, fontFamily: "'Open Sans',Arial,sans-serif" }}>No workspace selected.</div>;
  }

  if (activeDoc) {
    return (
      <div style={{ display: "flex", height: "100%", background: bg, fontFamily: "'Open Sans',Arial,sans-serif" }}>
        {/* Doc list sidebar */}
        <div style={{
          width: "240px", flexShrink: 0, borderRight: `1px solid ${border}`,
          background: panelBg, overflow: "auto",
        }}>
          <div style={{ padding: "16px", borderBottom: `1px solid ${border}` }}>
            <button
              onClick={createDoc}
              style={{
                width: "100%", padding: "8px", fontSize: "13px", fontWeight: 600,
                color: "#fff", background: ARC_BLUE, border: "none", borderRadius: "0",
                cursor: "pointer",
              }}
            >
              + New Document
            </button>
          </div>
          <div style={{ padding: "8px" }}>
            {docs.map((d) => (
              <button
                key={d.id}
                onClick={() => openDoc(d)}
                style={{
                  width: "100%", padding: "10px 12px", border: "none",
                  background: d.id === activeDoc.id ? `${ARC_BLUE}15` : "transparent",
                  borderRadius: "0", cursor: "pointer", textAlign: "left",
                  marginBottom: "2px",
                }}
              >
                <p style={{ fontSize: "13px", fontWeight: 600, color: textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.title}
                </p>
                <p style={{ fontSize: "11px", color: textSecondary, margin: "2px 0 0" }}>
                  {new Date(d.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "8px 16px", borderBottom: `1px solid ${border}`,
            background: panelBg, flexWrap: "wrap",
          }}>
            <ToolbarBtn onClick={() => exec("bold")} title="Bold"><b>B</b></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("italic")} title="Italic"><i>I</i></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("underline")} title="Underline"><u>U</u></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></ToolbarBtn>
            <Divider />
            <ToolbarBtn onClick={() => exec("formatBlock", "h1")} title="Heading 1">H1</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2">H2</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "h3")} title="Heading 3">H3</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "p")} title="Paragraph">P</ToolbarBtn>
            <Divider />
            <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">UL</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered list">OL</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "blockquote")} title="Quote">Q</ToolbarBtn>
            <Divider />
            <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align left">L</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("justifyCenter")} title="Align center">C</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("justifyRight")} title="Align right">R</ToolbarBtn>
            <Divider />
            <ToolbarBtn onClick={() => exec("insertHorizontalRule")} title="Divider">--</ToolbarBtn>
            <ToolbarBtn onClick={() => exec("createLink", prompt("Enter URL:") ?? undefined)} title="Insert link">Link</ToolbarBtn>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: "12px", color: textSecondary }}>
              {saving ? "Saving..." : "Saved"}
            </span>
          </div>

          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            style={{
              width: "100%", padding: "16px 60px 8px",
              fontSize: "24px", fontWeight: 700, color: textPrimary,
              border: "none", outline: "none", background: bg,
              fontFamily: "'Open Sans',Arial,sans-serif",
            }}
          />

          {/* Rich text editor */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            suppressContentEditableWarning
            style={{
              flex: 1, overflow: "auto", padding: "16px 60px 60px",
              fontSize: "15px", lineHeight: "1.8", color: textPrimary,
              outline: "none", background: bg,
              fontFamily: "'Open Sans',Arial,sans-serif",
              maxWidth: "800px", margin: "0 auto", width: "100%", boxSizing: "border-box",
            }}
          />

          {/* Back button */}
          <button
            onClick={() => { saveDoc(); setActiveDoc(null); }}
            style={{
              position: "absolute", top: "64px", left: "260px",
              padding: "6px 12px", fontSize: "12px", fontWeight: 600,
              color: textSecondary, background: "transparent",
              border: `1px solid ${border}`, borderRadius: "0", cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Doc list view
  return (
    <div style={{ background: bg, minHeight: "100%", padding: "32px 40px", fontFamily: "'Open Sans',Arial,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: textPrimary, margin: 0 }}>Loom Paper</h1>
          <p style={{ fontSize: "14px", color: textSecondary, marginTop: "4px" }}>Create and edit documents in {currentWorkspace.name}</p>
        </div>
        <button
          onClick={createDoc}
          style={{
            padding: "10px 20px", fontSize: "14px", fontWeight: 600,
            color: "#fff", background: ARC_BLUE, border: "none",
            borderRadius: "0", cursor: "pointer",
          }}
        >
          + New Document
        </button>
      </div>

      {loading ? (
        <p style={{ color: textSecondary, fontSize: "14px" }}>Loading...</p>
      ) : docs.length === 0 ? (
        <div style={{
          padding: "60px 24px", background: panelBg,
          border: `1px solid ${border}`, textAlign: "center",
        }}>
          <p style={{ fontSize: "14px", color: textSecondary, margin: "0 0 16px" }}>
            No documents yet. Create your first document to get started.
          </p>
          <button
            onClick={createDoc}
            style={{
              padding: "10px 24px", fontSize: "14px", fontWeight: 600,
              color: "#fff", background: ARC_BLUE, border: "none",
              borderRadius: "0", cursor: "pointer",
            }}
          >
            Create Document
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => openDoc(d)}
              style={{
                padding: "16px", background: panelBg,
                border: `1px solid ${border}`, borderRadius: "0",
                cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = isDark ? "#3a3d43" : "#d4d7e0")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
            >
              <p style={{ fontSize: "14px", fontWeight: 600, color: textPrimary, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.title}
              </p>
              <p style={{ fontSize: "12px", color: textSecondary, margin: "0" }}>
                {new Date(d.updated_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "32px", height: "32px", border: "none",
        background: "transparent", borderRadius: "0", cursor: "pointer",
        display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 600,
        color: "#1a1a2e", transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f2f5")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: "1px", height: "20px", background: "#ebebf0", margin: "0 4px" }} />;
}
