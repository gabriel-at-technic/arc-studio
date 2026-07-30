/*
# Create files table for Arc Drive

1. New Tables
- `files`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users on delete cascade)
  - `name` (text, not null — file name including extension)
  - `type` (text, not null — file category: 'document', 'pdf', 'signature', 'asset')
  - `source_app` (text, not null — which app created it: 'paper', 'editor', 'sign', 'slate', 'drive')
  - `storage_path` (text, nullable — path to file in Supabase Storage)
  - `content` (text, nullable — inline content for text-based files like documents)
  - `size_bytes` (bigint, nullable — file size)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Security
- Enable RLS on `files`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- SELECT, INSERT, UPDATE, DELETE policies scoped to `auth.uid() = user_id`.
- The `user_id` column defaults to `auth.uid()` so inserts that omit it still satisfy the INSERT policy.

3. Notes
- This table stores all files created or saved across every Arc app.
- The `type` column categorizes files for the Arc Drive tabs (Documents, PDFs, Signatures, Saved Assets).
- The `source_app` column tracks which app each file came from.
- `content` is used for inline text documents (from Loom Paper); binary files use `storage_path`.
*/

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('document', 'pdf', 'signature', 'asset')),
  source_app text NOT NULL CHECK (source_app IN ('paper', 'editor', 'sign', 'slate', 'drive')),
  storage_path text,
  content text,
  size_bytes bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_files" ON files;
CREATE POLICY "select_own_files"
ON files FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_files" ON files;
CREATE POLICY "insert_own_files"
ON files FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_files" ON files;
CREATE POLICY "update_own_files"
ON files FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_files" ON files;
CREATE POLICY "delete_own_files"
ON files FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id);
CREATE INDEX IF NOT EXISTS files_type_idx ON files(type);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON files(created_at DESC);
