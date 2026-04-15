# Garden Planning - Architecture

## Overview
Garden Planning is a Next.js 16 application for planning and managing home gardens. It features a visual planner for placing plants, trees, and flowers within zones, a seedbed tracker for starting seeds, and an AI-powered gardening assistant.

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite |
| ORM | Drizzle ORM (better-sqlite3) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Visualization | SVG (Planner), Leaflet (Setup) |
| AI | Google Gemini API |

---

## Directory Structure

```text
/app             # Next.js App Router (Pages & API Routes)
/components      # React Components (Modular & Reusable)
  /UI            # Low-level UI primitives (Button, Modal, etc.)
  /Map           # Map-related components and view
  /Seedbed       # Seedbed manager sub-components
/hooks           # Custom React Hooks (Business Logic)
/lib             # Shared Library (Constants, Helpers, DB Client)
/lib/db          # Drizzle ORM schema and client singleton
/data            # SQLite database file (gitignored)
/docs            # Documentation
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # AI chat endpoint
│   │   ├── seeds/         # Seed CRUD
│   │   ├── seedlings/     # Seedling CRUD
│   │   ├── zones/         # Zone CRUD
│   │   └── placements/    # Placement CRUD
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/
│   ├── AI/                # AI Chat widget
│   │   └── AIChat.tsx
│   ├── Map/               # Map-based views
│   │   ├── Map.tsx        # Aerial Setup view (Leaflet)
│   │   ├── SchematicView.tsx  # Planner view (SVG)
│   │   ├── ItemIcons.ts   # Emoji icon definitions
│   │   ├── ZoneEditor.tsx # Zone edit panel
│   │   └── ...
│   ├── Schematic/         # Planner subcomponents
│   │   ├── SchematicSidebar.tsx
│   │   ├── SchematicTools.tsx
│   │   ├── SchematicToolbar.tsx
│   │   ├── useSchematicViewport.ts
│   │   ├── useSchematicInteraction.ts
│   ├── Seedbed/           # Seedbed tracker
│   │   └── SeedbedView.tsx
│   └── Navigation.tsx     # Top nav bar
│
├── lib/
│   ├── db/
│   │   ├── index.ts       # Drizzle ORM client singleton (better-sqlite3)
│   │   └── schema.ts      # Database schema definitions
│   ├── utils.ts           # Utilities (cn, math)
│   └── ai/
│       └── gardenContext.ts  # Context builder for AI
│
├── data/
│   └── dev.db             # SQLite database (gitignored)
│
└── docs/                  # Documentation
```

---

## Database Schema

### Zone
Represents areas in the garden (planting beds, lawns, paths, etc.).

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique ID |
| geoJson | String | GeoJSON Polygon geometry |
| type | String | Zone type (field, grass, path, etc.) |
| name | String? | User-defined name |
| lastWateredAt | DateTime? | Last watering date |
| lastFertilizedAt | DateTime? | Last fertilizing date |

### Placement
Individual items placed within zones.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique ID |
| zoneId | String | Parent zone |
| type | String | `plant`, `tree`, `pot`, `flower` |
| lat/lng | Float | Position coordinates |
| metadata | JSON | Species, variety, notes, datePlanted, quantity |

### Seed / Seedling
Seedbed tracking models for starting seeds indoors.

---

## Core Concepts

### Coordinate System
- **Storage**: All positions use `latitude` and `longitude`
- **Projection**: Equirectangular approximation with scale factor of 100,000
- **Functions**:
  - `project(lat, lng)` → `{x, y}` for rendering
  - `unproject(x, y)` → `{lat, lng}` for clicks

### Views
1. **Planner View** (`SchematicView.tsx`): SVG-based visual editor for placing and managing plants
2. **Setup View** (`Map.tsx`): Leaflet aerial map for zone creation/editing
3. **Seedbed View** (`SeedbedView.tsx`): Track seeds and seedlings

### Core Components & Hooks

#### Hooks (Business Logic)
- **`useGardenData.ts`**: Centralized hook for managing garden data (zones and placements). Handles CRUD operations, state synchronization, and API interactions for the Map view.
- **`useSeedbed.ts`**: Manages seed inventory and seedling status state. Encapsulates filtering, sorting, and API calls for the Seedbed view.

#### Key Components
- **`Map.tsx`**: High-level component that utilizes `useGardenData` to render the interactive garden layout.
- **`SeedbedView.tsx`**: Modular view that composes `ActiveSeedlings`, `SeedInventoryTable`, and various form modals, driven by the `useSeedbed` hook.
- **`AIChat.tsx`**: The main interface for the AI assistant, now utilizing shared `Modal` components for settings and debugging.

#### Shared Modules
- **`lib/constants.ts`**: Central repository for application-wide constants including AI model configuration, item types, zone configurations, and month names.
- **`lib/helpers.ts`**: Shared utility functions such as `renderNotes` (auto-linking), `parseMetadata`, and `formatMonthRange`.
- **`lib/types.ts`**: Centralized TypeScript interfaces for core domain entities (Seed, Seedling, Zone, Placement).

### Data Flow
```
User Action → Local State (optimistic) → API Route → Drizzle ORM → SQLite
                                                              ↓
                                                    Response → State Update
```

---

## Key Components

### SchematicView (Planner)
Refactored into composable pieces:
- `useSchematicViewport`: Zoom, pan, rotation, projection math
- `useSchematicInteraction`: Mouse/keyboard events, tool placement, copy/paste, delete
- `SchematicToolbar`: Bottom controls (zoom, rotate, reset)
- `SchematicTools`: Tool palette (plant, tree, pot, flower)
- `SchematicSidebar`: Zone inventory and item editing

**Pan implementation note:** Panning converts screen-pixel deltas to SVG viewBox units using `svg.getScreenCTM().a` — not by dividing by `zoom`. The `zoom` is a nested SVG `scale()` transform inside the viewBox, so the viewBox-to-screen ratio is constant regardless of zoom level. This makes drag-to-pan feel uniform at all zoom levels.

**Copy/paste:** `useSchematicInteraction` maintains an in-memory `clipboardRef`. Cmd+C snapshots the selected items (preserving type, position, and full metadata). Cmd+V posts new placements via `onPaste` (which returns the new IDs) and immediately selects the pasted items so they can be dragged to their final position.

### AIChat
Floating chat widget with:
- Context-aware prompts (All/Planner/Seedbed/Selection filters)
- Editable system prompt with location and date
- Debug mode to inspect prompts
- Reset chat functionality

### Mobile Layout
The Planner view uses a two-tab bottom bar on small screens:
- **Map** tab: shows the SVG canvas
- **Inventory** tab: shows the sidebar (zone/item details)

Tapping an item on the canvas automatically switches to the Inventory tab.

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| W/A/S/D | Pan the map |
| Arrow keys | Move selected item/zone |
| Mouse wheel | Zoom |
| Click + drag | Pan (planner) |
| Cmd/Ctrl + C | Copy selected item(s) |
| Cmd/Ctrl + V | Paste copied item(s) ~50 cm offset |
| Backspace / Delete | Delete selected item(s) |

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zones` | GET/POST | List/create zones |
| `/api/zones/[id]` | PUT/DELETE | Update/delete zone |
| `/api/zones/restore` | POST | Restore from backup |
| `/api/placements` | POST | Create placement |
| `/api/placements/[id]` | PUT/DELETE | Update/delete placement |
| `/api/seeds` | GET/POST | List/create seeds |
| `/api/seeds/[id]` | PATCH/DELETE | Update/delete seed |
| `/api/seeds/extract` | POST | AI-extract seed info from image |
| `/api/seedlings` | GET/POST | List/create seedlings |
| `/api/seedlings/[id]` | PATCH/DELETE | Update/delete seedling |
| `/api/chat` | POST | AI chat endpoint |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Path to SQLite file. Use `file:./data/dev.db` locally or an absolute path in production. |
| `GOOGLE_API_KEY` | Google Gemini API key for AI features |
