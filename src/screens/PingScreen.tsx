import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { useAuth } from "../lib/auth";
import { ARC_BLUE, AppIcon } from "../components/AppHeader";

type Channel = {
  id: string;
  name: string;
  type: string;
};

type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function PingScreen({ isDark }: { isDark: boolean }) {
  const { currentWorkspace, members } = useWorkspace();
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [callMembers, setCallMembers] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? "#0f1419" : "#f7f9fc";
  const panelBg = isDark ? "#1a1f26" : "#fff";
  const textPrimary = isDark ? "#e6e6e6" : "#1a1a2e";
  const textSecondary = isDark ? "#8c8c94" : "#656871";
  const border = isDark ? "#2a2d33" : "#ebebf0";

  const fetchChannels = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data } = await supabase
      .from("ping_channels")
      .select("id, name, type")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: true });
    setChannels((data as Channel[]) ?? []);
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!activeChannel) return;
    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ping_messages", filter: `channel_id=eq.${activeChannel.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (!activeChannel) return;
    (async () => {
      const { data } = await supabase
        .from("ping_messages")
        .select("*")
        .eq("channel_id", activeChannel.id)
        .order("created_at", { ascending: true });
      setMessages((data as Message[]) ?? []);
    })();
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChannel = async (name: string, type: string = "direct") => {
    if (!currentWorkspace) return;
    const { data } = await supabase
      .from("ping_channels")
      .insert({ workspace_id: currentWorkspace.id, name, type })
      .select("id, name, type")
      .single();
    if (data) {
      const ch = data as Channel;
      setChannels([...channels, ch]);
      setActiveChannel(ch);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChannel || !user) return;
    const content = input.trim();
    setInput("");
    await supabase.from("ping_messages").insert({
      channel_id: activeChannel.id,
      content,
    });
  };

  const startCall = (type: "audio" | "video") => {
    setCallType(type);
    setCallActive(true);
    setCallMembers(members.map((m) => m.profile).filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined));
  };

  const endCall = () => {
    setCallActive(false);
    setCallMembers([]);
  };

  const getSenderName = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    return member?.profile?.display_name ?? "Unknown";
  };

  if (!currentWorkspace) {
    return <div style={{ padding: "40px", color: textSecondary, fontFamily: "'Open Sans',Arial,sans-serif" }}>No workspace selected.</div>;
  }

  return (
    <div style={{ display: "flex", height: "100%", background: bg, fontFamily: "'Open Sans',Arial,sans-serif" }}>
      {/* Channel list */}
      <div style={{
        width: "240px", flexShrink: 0, borderRight: `1px solid ${border}`,
        background: panelBg, display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${border}` }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: textPrimary, margin: 0 }}>Arc Ping</h2>
          <p style={{ fontSize: "12px", color: textSecondary, margin: "4px 0 0" }}>{currentWorkspace.name}</p>
        </div>
        <div style={{ padding: "8px", flex: 1, overflow: "auto" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: textSecondary, textTransform: "uppercase", letterSpacing: "0.6px", margin: "8px 8px 4px" }}>
            Channels
          </p>
          {loading ? (
            <p style={{ fontSize: "13px", color: textSecondary, padding: "8px" }}>Loading...</p>
          ) : channels.length === 0 ? (
            <p style={{ fontSize: "12px", color: textSecondary, padding: "8px" }}>No channels yet</p>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 12px", border: "none", borderRadius: "0",
                  background: ch.id === activeChannel?.id ? `${ARC_BLUE}15` : "transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <AppIcon name="ping" size={16} color={ch.id === activeChannel?.id ? ARC_BLUE : textSecondary} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: ch.id === activeChannel?.id ? textPrimary : textSecondary }}>
                  {ch.name}
                </span>
              </button>
            ))
          )}
        </div>
        <div style={{ padding: "8px", borderTop: `1px solid ${border}` }}>
          <button
            onClick={() => { const name = prompt("Channel name:"); if (name) createChannel(name); }}
            style={{
              width: "100%", padding: "8px", fontSize: "13px", fontWeight: 600,
              color: ARC_BLUE, background: "transparent",
              border: `1px solid ${border}`, borderRadius: "0", cursor: "pointer",
            }}
          >
            + New Channel
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeChannel ? (
          <>
            {/* Chat header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", borderBottom: `1px solid ${border}`, background: panelBg,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AppIcon name="ping" size={20} color={textPrimary} />
                <span style={{ fontSize: "15px", fontWeight: 700, color: textPrimary }}>{activeChannel.name}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => startCall("audio")}
                  title="Start audio call"
                  style={{
                    width: "36px", height: "36px", border: "none",
                    background: "transparent", borderRadius: "0", cursor: "pointer",
                    display: "grid", placeItems: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke={textPrimary} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => startCall("video")}
                  title="Start video meeting"
                  style={{
                    width: "36px", height: "36px", border: "none",
                    background: "transparent", borderRadius: "0", cursor: "pointer",
                    display: "grid", placeItems: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="6" width="14" height="12" rx="2" stroke={textPrimary} strokeWidth="1.8" fill="none" />
                    <path d="M16 10 L22 7 V17 L16 14 Z" stroke={textPrimary} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              {messages.length === 0 ? (
                <p style={{ color: textSecondary, fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.user_id === user?.id;
                  const senderName = getSenderName(msg.user_id);
                  return (
                    <div key={msg.id} style={{
                      display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start",
                      marginBottom: "12px",
                    }}>
                      <div style={{ maxWidth: "70%" }}>
                        {!isOwn && (
                          <p style={{ fontSize: "11px", fontWeight: 600, color: textSecondary, margin: "0 0 4px" }}>
                            {senderName}
                          </p>
                        )}
                        <div style={{
                          padding: "10px 14px",
                          background: isOwn ? ARC_BLUE : panelBg,
                          color: isOwn ? "#fff" : textPrimary,
                          border: `1px solid ${isOwn ? ARC_BLUE : border}`,
                          fontSize: "14px", lineHeight: "1.5",
                        }}>
                          {msg.content}
                        </div>
                        <p style={{ fontSize: "10px", color: textSecondary, margin: "4px 0 0", textAlign: isOwn ? "right" : "left" }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}`, background: panelBg, display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: "10px 14px", fontSize: "14px",
                  border: `1px solid ${border}`, borderRadius: "0",
                  outline: "none", background: bg, color: textPrimary, boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = ARC_BLUE)}
                onBlur={(e) => (e.target.style.borderColor = border)}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "10px 20px", fontSize: "14px", fontWeight: 600,
                  color: "#fff", background: ARC_BLUE, border: "none",
                  borderRadius: "0", cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ textAlign: "center" }}>
              <AppIcon name="ping" size={48} color={textSecondary} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: textPrimary, marginTop: "16px" }}>Select a channel to start messaging</p>
              <p style={{ fontSize: "13px", color: textSecondary, marginTop: "4px" }}>
                Create a channel to message your workspace members
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call / Meeting overlay */}
      {callActive && (
        <CallOverlay
          type={callType}
          members={callMembers}
          currentUserName={members.find((m) => m.user_id === user?.id)?.profile?.display_name ?? "You"}
          onEnd={endCall}
          isDark={isDark}
        />
      )}
    </div>
  );
}

function CallOverlay({
  type,
  members,
  currentUserName,
  onEnd,
  isDark,
}: {
  type: "audio" | "video";
  members: Profile[];
  currentUserName: string;
  onEnd: () => void;
  isDark: boolean;
}) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const allParticipants = [{ display_name: currentUserName, email: "you" }, ...members.filter((m) => m.email !== "you")];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "#0a0e14", display: "flex", flexDirection: "column",
      fontFamily: "'Open Sans',Arial,sans-serif",
    }}>
      {/* Call header */}
      <div style={{
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1a1f26",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
            {type === "video" ? "Video Meeting" : "Audio Call"}
          </span>
          <span style={{
            fontSize: "12px", color: "#00802f", fontWeight: 600,
            background: "#00802f15", padding: "2px 8px",
          }}>
            {formatTime(duration)}
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "#656871" }}>{allParticipants.length} participants</span>
      </div>

      {/* Participants grid */}
      <div style={{
        flex: 1, padding: "24px", display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px", alignContent: "center",
      }}>
        {allParticipants.map((p, i) => (
          <div key={i} style={{
            aspectRatio: "16/9", background: "#1a1f26",
            border: `1px solid #2a2d33`, display: "flex",
            alignItems: "center", justifyContent: "center", position: "relative",
          }}>
            {type === "video" && i === 0 && !videoOff ? (
              <div style={{
                width: "100%", height: "100%", background: "#0f1419",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "12px", color: "#656871" }}>Your camera</span>
              </div>
            ) : (
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${ARC_BLUE}, #4f46e5)`,
                color: "#fff", display: "grid", placeItems: "center",
                fontSize: "28px", fontWeight: 700,
              }}>
                {(p.display_name ?? "U")[0]?.toUpperCase()}
              </div>
            )}
            <div style={{
              position: "absolute", bottom: "8px", left: "8px",
              padding: "4px 10px", background: "rgba(0,0,0,0.6)",
              fontSize: "12px", color: "#fff", fontWeight: 600,
            }}>
              {p.display_name ?? "Unknown"}{i === 0 ? " (You)" : ""}
            </div>
            {i === 0 && muted && (
              <div style={{
                position: "absolute", top: "8px", right: "8px",
                background: "#db0000", padding: "4px 8px", fontSize: "10px",
                color: "#fff", fontWeight: 700,
              }}>
                MUTED
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call controls */}
      <div style={{
        padding: "20px", display: "flex", justifyContent: "center", gap: "12px",
        borderTop: "1px solid #1a1f26",
      }}>
        <CallBtn active={!muted} onClick={() => setMuted(!muted)} title={muted ? "Unmute" : "Mute"}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            {muted ? (
              <>
                <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
                <line x1="3" y1="3" x2="21" y2="21" stroke="#db0000" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
            )}
          </svg>
        </CallBtn>
        {type === "video" && (
          <CallBtn active={!videoOff} onClick={() => setVideoOff(!videoOff)} title={videoOff ? "Turn on camera" : "Turn off camera"}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="14" height="12" rx="2" stroke="#fff" strokeWidth="1.8" fill="none" />
              <path d="M16 10 L22 7 V17 L16 14 Z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
              {videoOff && <line x1="3" y1="3" x2="21" y2="21" stroke="#db0000" strokeWidth="2" strokeLinecap="round" />}
            </svg>
          </CallBtn>
        )}
        <CallBtn active onClick={onEnd} danger title="End call">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 8 C6 5 8 4 10 5 L12 8 L10 10 C11 13 13 15 16 16 L18 14 L21 16 C22 18 21 20 18 20 C10 20 4 14 4 8 Z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" transform="rotate(135 12 12)" />
          </svg>
        </CallBtn>
      </div>
    </div>
  );
}

function CallBtn({
  children,
  onClick,
  active,
  danger,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "52px", height: "52px", borderRadius: "50%",
        background: danger ? "#db0000" : active ? "#2a2d33" : "#1a1f26",
        border: "none", cursor: "pointer",
        display: "grid", placeItems: "center",
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}
