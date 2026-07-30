/*
# Create workspaces, members, documents, assets, ping channels and messages

## Overview
This migration adds multi-workspace support to Arc Studio. Users belong to
workspaces; workspace members have roles (admin/member). Documents (Loom Paper)
and assets (Arc Slate) are scoped to a workspace. Ping channels and messages
enable real-time P2P messaging within a workspace.

## New Tables
1. workspaces - id, name, slug, created_by, created_at
2. workspace_members - id, workspace_id, user_id, role, joined_at
3. documents - id, workspace_id, user_id, title, content, created_at, updated_at
4. assets - id, workspace_id, user_id, name, type, url, content, editable, created_at
5. ping_channels - id, workspace_id, name, type, created_at
6. ping_channel_members - id, channel_id, user_id
7. ping_messages - id, channel_id, user_id, content, created_at

## Security
All tables have RLS enabled. Access scoped to workspace membership.

## Notes
- Owner columns default to auth.uid() so frontend inserts work without user_id.
- files.source_app check updated to include 'paper'.
*/

-- Extend files.source_app to include 'paper'
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_source_app_check;
ALTER TABLE files ADD CONSTRAINT files_source_app_check
  CHECK (source_app = ANY (ARRAY['paper'::text, 'editor'::text, 'sign'::text, 'slate'::text, 'drive'::text]));

-- ============ workspaces ============
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ============ workspace_members ============
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- ============ documents ============
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============ assets ============
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'picture' CHECK (type IN ('picture','text','diagram','pdf','page')),
  url text,
  content text,
  editable boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- ============ ping_channels ============
CREATE TABLE IF NOT EXISTS ping_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','group','meeting')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ping_channels ENABLE ROW LEVEL SECURITY;

-- ============ ping_channel_members ============
CREATE TABLE IF NOT EXISTS ping_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES ping_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (channel_id, user_id)
);
ALTER TABLE ping_channel_members ENABLE ROW LEVEL SECURITY;

-- ============ ping_messages ============
CREATE TABLE IF NOT EXISTS ping_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES ping_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ping_messages ENABLE ROW LEVEL SECURITY;

-- ============ Helper: membership check function ============
CREATE OR REPLACE FUNCTION is_workspace_member(check_user uuid, check_workspace uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.user_id = check_user
      AND workspace_members.workspace_id = check_workspace
  );
$$;

-- ============ POLICIES ============

-- workspaces
DROP POLICY IF EXISTS "ws_select_member" ON workspaces;
CREATE POLICY "ws_select_member" ON workspaces FOR SELECT
  TO authenticated USING (is_workspace_member(auth.uid(), id));

DROP POLICY IF EXISTS "ws_insert_creator" ON workspaces;
CREATE POLICY "ws_insert_creator" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "ws_update_creator" ON workspaces;
CREATE POLICY "ws_update_creator" ON workspaces FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "ws_delete_creator" ON workspaces;
CREATE POLICY "ws_delete_creator" ON workspaces FOR DELETE
  TO authenticated USING (created_by = auth.uid());

-- workspace_members
DROP POLICY IF EXISTS "wm_select_member" ON workspace_members;
CREATE POLICY "wm_select_member" ON workspace_members FOR SELECT
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;
CREATE POLICY "wm_insert_admin" ON workspace_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "wm_update_admin" ON workspace_members;
CREATE POLICY "wm_update_admin" ON workspace_members FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "wm_delete_admin" ON workspace_members;
CREATE POLICY "wm_delete_admin" ON workspace_members FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  );

-- documents
DROP POLICY IF EXISTS "doc_select_member" ON documents;
CREATE POLICY "doc_select_member" ON documents FOR SELECT
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "doc_insert_member" ON documents;
CREATE POLICY "doc_insert_member" ON documents FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "doc_update_member" ON documents;
CREATE POLICY "doc_update_member" ON documents FOR UPDATE
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "doc_delete_member" ON documents;
CREATE POLICY "doc_delete_member" ON documents FOR DELETE
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- assets
DROP POLICY IF EXISTS "asset_select_member" ON assets;
CREATE POLICY "asset_select_member" ON assets FOR SELECT
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "asset_insert_member" ON assets;
CREATE POLICY "asset_insert_member" ON assets FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "asset_update_member" ON assets;
CREATE POLICY "asset_update_member" ON assets FOR UPDATE
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "asset_delete_member" ON assets;
CREATE POLICY "asset_delete_member" ON assets FOR DELETE
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- ping_channels
DROP POLICY IF EXISTS "pc_select_member" ON ping_channels;
CREATE POLICY "pc_select_member" ON ping_channels FOR SELECT
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "pc_insert_member" ON ping_channels;
CREATE POLICY "pc_insert_member" ON ping_channels FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "pc_update_member" ON ping_channels;
CREATE POLICY "pc_update_member" ON ping_channels FOR UPDATE
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "pc_delete_member" ON ping_channels;
CREATE POLICY "pc_delete_member" ON ping_channels FOR DELETE
  TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- ping_channel_members
DROP POLICY IF EXISTS "pcm_select_member" ON ping_channel_members;
CREATE POLICY "pcm_select_member" ON ping_channel_members FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ping_channels pc
      WHERE pc.id = ping_channel_members.channel_id
        AND is_workspace_member(auth.uid(), pc.workspace_id)
    )
  );

DROP POLICY IF EXISTS "pcm_insert_member" ON ping_channel_members;
CREATE POLICY "pcm_insert_member" ON ping_channel_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM ping_channels pc
      WHERE pc.id = ping_channel_members.channel_id
        AND is_workspace_member(auth.uid(), pc.workspace_id)
    )
  );

DROP POLICY IF EXISTS "pcm_delete_member" ON ping_channel_members;
CREATE POLICY "pcm_delete_member" ON ping_channel_members FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ping_channels pc
      WHERE pc.id = ping_channel_members.channel_id
        AND is_workspace_member(auth.uid(), pc.workspace_id)
    )
  );

-- ping_messages
DROP POLICY IF EXISTS "pm_select_member" ON ping_messages;
CREATE POLICY "pm_select_member" ON ping_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ping_channels pc
      WHERE pc.id = ping_messages.channel_id
        AND is_workspace_member(auth.uid(), pc.workspace_id)
    )
  );

DROP POLICY IF EXISTS "pm_insert_member" ON ping_messages;
CREATE POLICY "pm_insert_member" ON ping_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM ping_channels pc
      WHERE pc.id = ping_messages.channel_id
        AND is_workspace_member(auth.uid(), pc.workspace_id)
    )
  );

DROP POLICY IF EXISTS "pm_delete_member" ON ping_messages;
CREATE POLICY "pm_delete_member" ON ping_messages FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ping_channels pc
      WHERE pc.id = ping_messages.channel_id
        AND is_workspace_member(auth.uid(), pc.workspace_id)
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_workspace ON assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ping_channels_workspace ON ping_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ping_messages_channel ON ping_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_ping_channel_members_channel ON ping_channel_members(channel_id);
