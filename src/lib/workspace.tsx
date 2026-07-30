import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, type Profile } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export type Workspace = {
  id: string;
  name: string;
  slug: string | null;
  created_by: string | null;
  created_at: string;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profile?: Profile | null;
};

type WorkspaceContextValue = {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  loading: boolean;
  needsSetup: boolean;
  setCurrentWorkspace: (ws: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  addMember: (email: string, role: "admin" | "member") => Promise<{ error: string | null }>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: "admin" | "member") => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({
  session,
  children,
}: {
  session: Session | null;
  user: User | null;
  children: ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const fetchWorkspaces = async (userId: string) => {
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId);

    if (!memberships || memberships.length === 0) {
      setWorkspaces([]);
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    const wsIds = memberships.map((m: { workspace_id: string }) => m.workspace_id);
    const { data: wsData } = await supabase
      .from("workspaces")
      .select("*")
      .in("id", wsIds);

    const wsList = (wsData as Workspace[]) ?? [];
    setWorkspaces(wsList);
    setNeedsSetup(wsList.length === 0);

    if (wsList.length > 0 && !currentWorkspace) {
      setCurrentWorkspaceState(wsList[0]);
    }
    setLoading(false);
  };

  const refreshWorkspaces = async () => {
    if (session?.user) await fetchWorkspaces(session.user.id);
  };

  const fetchMembers = async (wsId: string) => {
    const { data: memData } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", wsId);

    const memList = (memData as WorkspaceMember[]) ?? [];
    const userIds = memList.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const profileMap = new Map<string, Profile>();
    (profiles as Profile[] | null)?.forEach((p) => profileMap.set(p.id, p));

    setMembers(
      memList.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      }))
    );
  };

  const refreshMembers = async () => {
    if (currentWorkspace) await fetchMembers(currentWorkspace.id);
  };

  useEffect(() => {
    if (session?.user) {
      fetchWorkspaces(session.user.id);
    } else {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setMembers([]);
      setLoading(false);
      setNeedsSetup(false);
    }
  }, [session]);

  useEffect(() => {
    if (currentWorkspace) fetchMembers(currentWorkspace.id);
    else setMembers([]);
  }, [currentWorkspace]);

  const createWorkspace = async (name: string): Promise<Workspace | null> => {
    if (!session?.user) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: ws, error } = await supabase
      .from("workspaces")
      .insert({ name, slug, created_by: session.user.id })
      .select("*")
      .single();

    if (error || !ws) return null;
    const wsRow = ws as Workspace;

    await supabase
      .from("workspace_members")
      .insert({
        workspace_id: wsRow.id,
        user_id: session.user.id,
        role: "admin",
      });

    await refreshWorkspaces();
    setCurrentWorkspaceState(wsRow);
    setNeedsSetup(false);
    return wsRow;
  };

  const addMember = async (
    email: string,
    role: "admin" | "member"
  ): Promise<{ error: string | null }> => {
    if (!currentWorkspace) return { error: "No workspace selected" };
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    if (!profile) return { error: "No user found with that email" };
    const userId = (profile as { id: string }).id;

    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: currentWorkspace.id,
      user_id: userId,
      role,
    });

    if (error) return { error: error.message };
    await refreshMembers();
    return { error: null };
  };

  const removeMember = async (userId: string) => {
    if (!currentWorkspace) return;
    await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", currentWorkspace.id)
      .eq("user_id", userId);
    await refreshMembers();
  };

  const updateMemberRole = async (userId: string, role: "admin" | "member") => {
    if (!currentWorkspace) return;
    await supabase
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", currentWorkspace.id)
      .eq("user_id", userId);
    await refreshMembers();
  };

  const setCurrentWorkspace = (ws: Workspace) => {
    setCurrentWorkspaceState(ws);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        members,
        loading,
        needsSetup,
        setCurrentWorkspace,
        refreshWorkspaces,
        refreshMembers,
        createWorkspace,
        addMember,
        removeMember,
        updateMemberRole,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
