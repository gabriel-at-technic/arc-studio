/*
# Create profiles table for Arc ID

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users on delete cascade)
  - `email` (text, not null — copied from auth.users at signup)
  - `display_name` (text, nullable — user-chosen display name)
  - `avatar_url` (text, nullable — URL to avatar image)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only access their own profile row.
- SELECT, INSERT, UPDATE, DELETE policies scoped to `auth.uid() = id`.
- The `id` column defaults to `auth.uid()` so inserts from the client that omit `id` still satisfy the INSERT policy.

3. Notes
- This table stores the public profile for each Arc ID account.
- A trigger could be added later to auto-insert a row when a new auth.users record is created,
  but for now the frontend will insert the profile row explicitly after signup.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);
