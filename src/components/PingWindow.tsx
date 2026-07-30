import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { useAuth } from "../lib/auth";
import { ARC_BLUE, AppIcon } from "./AppHeader";

type Channel = { id: string; name: string; type: string };
type Message = { id: string; channel_id: string; user_id: string; content: string; created_at: string };

export function PingWindow({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const { currentWorkspace, members } = useWorkspace();
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 100, y: 80 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const bg = isDark ? "#0f1419" : "#fff";
  const panelBg = isDark ? "#1a1f26" : "#f7f9fc";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";

  const fetchChannels = useCallback(async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase
      .from("ping_channels")
      .select("id, name, type")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: true });
    setChannels((data as Channel[]) ?? []);
  }, [currentWorkspace]);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  useEffect(() => {
    if (!activeChannel) return;
    const ch = supabase
      .channel(`win-msgs:${activeChannel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ping_messages", filter: `channel_id=eq.${activeChannel.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeChannel]);

  useEffect(() => {
    if (!activeChannel) return;
    (async () => {
      const { data } = await supabase.from("ping_messages").select("*").eq("channel_id", activeChannel.id).order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
    })();
  }, [activeChannel]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChannel) return;
    const content = input.trim();
    setInput("");
    await supabase.from("ping_messages").insert({ channel_id: activeChannel.id, content });
  };

  const getSenderName = (uid: string) => members.find((m) => m.user_id === uid)?.profile?.display_name ?? "Unknown";

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

  const createChannel = async (name: string) => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("ping_channels").insert({ workspace_id: currentWorkspace.id, name, type: "direct" }).select("id, name, type").single();
    if (data) { const ch = data as Channel; setChannels([...channels, ch]); setActiveChannel(ch); }
  };

  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, zIndex: 350,
      width: "380px", height: "480px", background: bg,
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
          <AppIcon name="ping" size={18} color={textPrimary} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: textPrimary }}>Arc Ping</span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setCallActive(true)} title="Call" style={{ border: "none", background: "none", cursor: "pointer", padding: "4px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke={textPrimary} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "16px", color: textSecondary, padding: "4px" }}>x</button>
        </div>
      </div>

      {/* Channel tabs */}
      <div style={{ display: "flex", gap: "2px", padding: "6px 8px", borderBottom: `1px solid ${border}`, overflowX: "auto" }}>
        {channels.map((ch) => (
          <button key={ch.id} onClick={() => setActiveChannel(ch)} style={{
            padding: "4px 10px", fontSize: "12px", fontWeight: 600, border: "none",
            background: ch.id === activeChannel?.id ? `${ARC_BLUE}15` : "transparent",
            color: ch.id === activeChannel?.id ? ARC_BLUE : textSecondary,
            borderRadius: "0", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {ch.name}
          </button>
        ))}
        <button onClick={() => { const n = prompt("Channel name:"); if (n) createChannel(n); }} style={{
          padding: "4px 8px", fontSize: "12px", border: "none",
          background: "transparent", color: ARC_BLUE, cursor: "pointer", whiteSpace: "nowrap",
        }}>+</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px 14px" }}>
        {activeChannel ? (messages.length === 0 ? (
          <p style={{ color: textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: "8px" }}>
                <div style={{ maxWidth: "80%" }}>
                  {!isOwn && <p style={{ fontSize: "10px", fontWeight: 600, color: textSecondary, margin: "0 0 2px" }}>{getSenderName(msg.user_id)}</p>}
                  <div style={{
                    padding: "8px 12px", fontSize: "13px", lineHeight: "1.4",
                    background: isOwn ? ARC_BLUE : panelBg,
                    color: isOwn ? "#fff" : textPrimary,
                    border: `1px solid ${isOwn ? ARC_BLUE : border}`,
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )) : (
          <p style={{ color: textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>Select a channel</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 10px", borderTop: `1px solid ${border}`, display: "flex", gap: "6px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message..."
          style={{
            flex: 1, padding: "8px 10px", fontSize: "13px",
            border: `1px solid ${border}`, borderRadius: "0", outline: "none",
            background: panelBg, color: textPrimary, boxSizing: "border-box",
          }}
        />
        <button onClick={sendMessage} style={{
          padding: "8px 14px", fontSize: "13px", fontWeight: 600,
          color: "#fff", background: ARC_BLUE, border: "none", borderRadius: "0", cursor: "pointer",
        }}>
          Send
        </button>
      </div>

      {callActive && (
        <MiniCallOverlay type={callType} onEnd={() => setCallActive(false)} isDark={isDark} />
      )}
    </div>
  );
}

function MiniCallOverlay({ type, onEnd, isDark }: { type: "audio" | "video"; onEnd: () => void; isDark: boolean }) {
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "#0a0e14", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "24px",
      fontFamily: "'Open Sans',Arial,sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "100px", height: "100px", borderRadius: "50%",
          background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
          color: "#fff", display: "grid", placeItems: "center",
          fontSize: "36px", fontWeight: 700, margin: "0 auto 16px",
        }}>
          Y
        </div>
        <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
          {type === "video" ? "Video Meeting" : "Audio Call"}
        </p>
        <p style={{ fontSize: "14px", color: "#656871" }}>{fmt(duration)}</p>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={() => setMuted(!muted)} style={{
          width: "48px", height: "48px", borderRadius: "50%",
          background: muted ? "#db0000" : "#2a2d33", border: "none", cursor: "pointer",
          display: "grid", placeItems: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            {muted && <line x1="3" y1="3" x2="21" y2="21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
        <button onClick={onEnd} style={{
          width: "48px", height: "48px", borderRadius: "50%",
          background: "#db0000", border: "none", cursor: "pointer",
          display: "grid", placeItems: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" transform="rotate(135 12 12)" />
          </svg>
        </button>
      </div>
    </div>
  );
}
