/*
# Fix workspace creation RLS policies

## Problem
The original workspace_members INSERT policy required that the inserter
already be an admin of the workspace. This created a chicken-and-egg problem:
you can't add yourself as admin because you're not admin yet.

## Fix
1. Allow workspace creators (where workspace.created_by = auth.uid()) to insert
   themselves as the first admin member.
2. Allow workspace creators to insert any member.
3. Keep the admin-only restriction for subsequent additions.

The workspace SELECT policy also had an issue: it used is_workspace_member() 
which checks workspace_members table, but new workspace creators aren't in that 
table yet. We relax it to also allow the workspace creator to see their workspace.
*/

-- Allow workspace creator to SELECT their own workspace immediately after creation
DROP POLICY IF EXISTS "ws_select_member" ON workspaces;
CREATE POLICY "ws_select_member" ON workspaces FOR SELECT
  TO authenticated USING (
    created_by = auth.uid()
    OR is_workspace_member(auth.uid(), id)
  );

-- Fix workspace_members INSERT: allow workspace creator to add members, OR admins to add members
DROP POLICY IF EXISTS "wm_insert_admin" ON workspace_members;
CREATE POLICY "wm_insert_admin" ON workspace_members FOR INSERT
  TO authenticated WITH CHECK (
    -- Workspace creator can insert themselves (or anyone) as the first member
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.created_by = auth.uid()
    )
    OR
    -- Existing admins can add more members
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id
        AND wm2.user_id = auth.uid()
        AND wm2.role = 'admin'
    )
  );

-- Also allow workspace creator to select their own member rows even before joining
DROP POLICY IF EXISTS "wm_select_member" ON workspace_members;
CREATE POLICY "wm_select_member" ON workspace_members FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR is_workspace_member(auth.uid(), workspace_id)
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
        AND w.created_by = auth.uid()
    )
  );
