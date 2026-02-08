# Garden Planner Architecture

## Project Overview
This project is a Next.js-based web application for planning and managing garden layouts. It uses a coordinate-based system to place items (plants, trees, pots) within defined zones (planting beds).

## Directory Structure

\`\`\`
/
├── components/          # React components
│   ├── Map/             # Main visualization components (SchematicView, Map)
│   ├── Schematic/       # Refactored sub-components and hooks for the Schematic View
│   └── ui/              # Shared UI elements (buttons, inputs)
├── lib/                 # Utilities and helper functions
│   ├── utils.ts         # General utilities (cn, math)
│   └── db.ts            # Prisma client instance
├── prisma/              # Database schema and migrations
└── app/                 # Next.js App Router pages
\`\`\`

## Key Concepts

### 1. Geospatial Coordinate System
- **Storage**: All positions are stored as `latitude` and `longitude`.
- **Projection**: The application uses a local flat-plane projection (Equirectangular approximation) centered on the garden's centroid.
- **Math**:
  - `project(lat, lng) -> {x, y}`: Converts world coords to SVG/Canvas storage coords.
  - `unproject(x, y) -> {lat, lng}`: Converts screen clicks back to world coords.
- **Scale**: A scaling factor of `100000` is used to make small lat/lng deltas renderable as pixel-like units.

### 2. Zones (GeoJSON)
- Zones represent planting beds, lawns, or other areas.
- **Format**: Stored as Standard GeoJSON `Polygon` features in the database.
- **Rendering**: Rendered as SVG `<polygon>` elements.

### 3. Data Flow
- **Persistence**: SQLite database via Prisma ORM.
- **State Management**:
  - **Server Actions**: Handle DB writes (`createItem`, `updateZone`, etc.).
  - **Local State**: React `useState` handles immediate UI feedback (dragging, panning).
  - **Optimistic Updates**: Context or local state reflects changes immediately while the server action persists them.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (local)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Visualization**: SVG (native) for the Schematic View

## Components

### SchematicView
The core planner interface, now refactored into:
- `useSchematicViewport`: Handles zoom, pan, rotation, and projection math.
- `useSchematicInteraction`: Handles mouse/keyboard events, dragging, and tool placement.
- `SchematicToolbar`: Bottom floating controls.
- `SchematicTools`: Tool selection palette.
- `SchematicSidebar`: Side panel for inventory and property editing.
