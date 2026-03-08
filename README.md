# 🌱 Garden Planning

A smart garden management and visualization tool built with Next.js, Prisma, and Leaflet. Plan your crops, track seedings, and optimize your garden layout with AI-powered assistance.

## ✨ Features

- **Interactive Garden Map**: Design your garden layout using Leaflet with custom zones and item placement.
- **Seedbed Management**: Track your seed inventory, sowing dates, and seedling status.
- **AI Garden Assistant**: Leverage Google Gemini to get planting advice and optimize your garden planning.
- **Task Tracking**: Stay on top of garden maintenance with integrated tracking (Coming Soon).

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/) with SQLite (local development)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Maps**: [Leaflet](https://leafletjs.org/) & [React Leaflet](https://react-leaflet.js.org/)
- **AI**: [Google Generative AI (Gemini)](https://ai.google.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm / yarn / pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Garden_planning.git
   cd Garden_planning
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Copy the example environment file and add your keys:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your `GOOGLE_API_KEY`.

4. **Initialize Database**:
   ```bash
   npx prisma db push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   # or use the startup script
   ./start-dev.sh
   ```

Open [http://localhost:3000](http://localhost:3000) to see your garden planner in action!

## 📖 Usage

### Planning Zones
Use the **Setup View** to define the boundaries of your garden, greenhouse, or seedbeds.

### Managing Seeds
Navigate to the **Seedbed View** to log new seeds, track sowing dates, and update seedling health.

### Layout Design
In the **Planner View**, drag and drop plants and structures onto your garden map to visualize your next season.

## 🤝 Contributing

Contributions are welcome! 

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This is a personal project created by me. It is not an official Google product and is not connected to or supported by Google in any way.
