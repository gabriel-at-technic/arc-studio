# Arc Studio

An open-source creative suite platform built with React, AWS Cloudscape Design System, Porsche Design System, and Supabase.

## Features

### Apps
- **Arc Drive** — File storage and management with workspace-scoped storage tracking
- **Loom Paper** — A powerful word processor with rich text editing, auto-save, and formatting toolbar (bold, italic, headings, lists, quotes, links, alignment, dividers)
- **Arc Slate** — Workspace asset gallery for pictures, text, diagrams, PDFs, and pages. Assets are draggable into any project
- **Arc Ping** — Real-time peer-to-peer messaging with channels, audio calls, and video meetings (Skype for Business style UI)
- **Loom Editor** — PDF editor (coming soon)
- **Loom Sign** — Document signing (coming soon)

### Workspace System
- Multi-workspace support — create and switch between workspaces
- Role-based access control (admin / member)
- First-boot setup wizard for workspace creation and team invitations
- Settings panel with member management, role assignment, and display mode toggle

### Design
- Flat, sharp design — no shadows, no rounded corners
- Light and dark display modes (toggle in Settings)
- AWS Cloudscape Design System components and design tokens
- Porsche Design System components
- Three-column layout: workspace rail (icons) + app sidebar (navigation) + main content
- Persistent top header with waffle menu (9 filled squares), Arc Studio logo, and quick-access Ping/Slate buttons

### Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Design Systems**: AWS Cloudscape + Porsche Design System
- **Real-time**: Supabase Realtime for P2P messaging
- **Storage**: Supabase Storage for file uploads

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/arc-studio.git
cd arc-studio
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## First-Boot Setup

When you first sign up, Arc Studio walks you through a setup wizard:

1. **Name your workspace** — Give your workspace a name
2. **Invite your team** — Add members by email with admin or member roles
3. **Review & finish** — Confirm your setup and enter the app

The first user becomes the workspace admin and can manage members from Settings.

## Database Schema

### Tables
- `profiles` — User profiles (linked to Supabase Auth)
- `workspaces` — Workspace definitions
- `workspace_members` — Membership with roles (admin/member)
- `documents` — Loom Paper documents (workspace-scoped)
- `assets` — Arc Slate assets (workspace-scoped)
- `files` — Arc Drive files
- `ping_channels` — Messaging channels (direct/group/meeting)
- `ping_channel_members` — Channel membership
- `ping_messages` — Real-time messages

### Security
- Row Level Security (RLS) enabled on all tables
- Access scoped to workspace membership
- Owner columns default to `auth.uid()`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 6 |
| Language | TypeScript |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Design System | AWS Cloudscape Design System |
| Components | Porsche Design System |
| Icons | Custom SVG + Cloudscape Icons |

## License

This project is licensed under the terms specified in the LICENSE file.

## Contributing

Arc Studio is open source. Contributions are welcome — please open an issue or submit a pull request.

## Project Structure

```
src/
├── components/
│   ├── AppHeader.tsx        # Top header with waffle menu, logo, quick buttons
│   ├── WorkspaceRail.tsx    # Left icon rail (workspace switcher, app icons)
│   ├── SettingsPanel.tsx    # Settings drawer (display mode, members)
│   ├── PingWindow.tsx       # Floating Arc Ping messaging window
│   └── SlateWindow.tsx     # Floating Arc Slate asset window
├── screens/
│   ├── HomeScreen.tsx       # App tile grid + recent files
│   ├── DriveScreen.tsx      # File storage and management
│   ├── PaperScreen.tsx     # Loom Paper word processor
│   ├── PingScreen.tsx       # Arc Ping full-screen messaging + calls
│   ├── SlateScreen.tsx      # Arc Slate asset gallery
│   ├── LoginScreen.tsx      # Sign in
│   ├── SignUpScreen.tsx     # Sign up
│   └── SetupWizard.tsx      # First-boot workspace setup
├── lib/
│   ├── auth.tsx             # Supabase auth context
│   ├── workspace.tsx        # Workspace context and CRUD
│   └── supabase.ts          # Supabase client
└── App.tsx                  # Root app with layout
```
