# Garden Planner Pro - User Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd Garden_planning

# Install dependencies
npm install

# Set up the database
npx prisma db push

# Start the development server
npm run dev
```

### Environment Setup
Create a `.env` file with:
```
DATABASE_URL="file:./dev.db"
GOOGLE_API_KEY="your-gemini-api-key"
```

---

## Views

### 🗺️ Planner View (Default)
The main garden planning interface.

**Features:**
- Visual map of your garden zones
- Place plants, trees, pots, and flowers
- Edit metadata (species, variety, planting date, notes)
- Zone inventory sidebar

**Controls:**
| Action | How |
|--------|-----|
| Pan | WASD keys or click + drag |
| Zoom | Mouse wheel or +/- buttons |
| Rotate | Rotation slider in toolbar |
| Place item | Select zone → Click tool → Click on zone |
| Edit item | Click on item in map or sidebar |
| Move item | Arrow keys (with item selected) |

### 🌍 Setup View
Aerial map view for creating and managing zones.

**Features:**
- Draw new zones on the satellite map
- Edit zone names and types
- Delete zones
- Drag zone vertices to reshape

**Note:** Plant placement is done in the Planner view only.

### 🌱 Seedbed View
Track your seed starting indoors.

**Features:**
- Manage seed inventory (species, quantity, expiry)
- Track seedlings (seeded, sprouted, transplanted)
- Record dates and locations

---

## Using the AI Assistant

Click the 🤖 button in the bottom-right corner to open the AI chat.

### Context Filters
- **All**: Full garden context
- **Planner**: Only zones and placements
- **Seedbed**: Only seeds and seedlings
- **Selection**: Only currently selected zone/item

### Features
- **⚙️ System Prompt**: Edit the AI's instructions, location, and expertise
- **🐞 Debug**: View the last prompt sent to the AI
- **↺ Reset**: Clear chat history

### Example Questions
- "What should I plant next to my tomatoes?"
- "When should I start seeds for peppers in Zurich?"
- "How much space do I need for a plum tree?"

---

## Placement Types

| Icon | Type | Use Case |
|------|------|----------|
| 🌱 | Plant | Vegetables, herbs |
| 🌳 | Tree | Fruit trees, ornamental trees |
| 🪴 | Pot | Container plants |
| 🌸 | Flower | Ornamental flowers |

---

## Tips

1. **Create zones first** in the Setup view before adding plants
2. **Use descriptive names** for zones (e.g., "Tomato Bed 2024")
3. **Track watering/fertilizing** using the zone action buttons
4. **Export your data** using the Export button in the navigation
5. **Use the AI** for companion planting suggestions

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W | Pan up |
| A | Pan left |
| S | Pan down |
| D | Pan right |
| ↑↓←→ | Move selected item/zone |
| Scroll | Zoom in/out |

---

## Troubleshooting

### AI not responding
- Check that `GOOGLE_API_KEY` is set in `.env`
- Restart the dev server after changing environment variables

### Database errors
```bash
npx prisma db push
npx prisma generate
```

### Placements not showing
- Ensure placements are inside a zone
- Try refreshing the page
