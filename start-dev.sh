#!/bin/bash

# Garden Planning - Local Startup Script

echo "🌱 Starting Garden Planning development environment..."

# 1. Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 2. Generate Prisma client and sync database schema
echo "🗄️  Generating Prisma client and syncing database schema..."
npx prisma generate
npx prisma db push

# 3. Start development server
echo "🚀 Starting Next.js development server..."
npm run dev
