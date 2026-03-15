#!/bin/bash

# Garden Planning - Local Startup Script (development)

echo "🌱 Starting Garden Planning development environment..."

# 1. Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 2. Generate Drizzle client and sync database schema
echo "🗄️  Syncing database schema..."
npx drizzle-kit push

# 3. Start development server
echo "🚀 Starting Next.js development server..."
npm run dev
