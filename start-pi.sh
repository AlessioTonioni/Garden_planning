#!/bin/bash

# Garden Planning - Raspberry Pi Production Startup Script
#
# Prerequisites on the Pi:
#   sudo apt-get install -y build-essential python3
#   # Node 18+ via NodeSource or nvm
#
# Recommended: enable swap (safety net for memory spikes)
#   sudo dphys-swapfile swapoff
#   sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
#   sudo dphys-swapfile setup && sudo dphys-swapfile swapon

set -e

echo "🌱 Starting Garden Planning (production)..."

# 1. Install dependencies if needed (better-sqlite3 compiles from source here)
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a few minutes on first run)..."
    npm install --omit=dev
fi

# 2. Sync database schema
echo "🗄️  Syncing database schema..."
npx drizzle-kit push

# 3. Build if .next/standalone doesn't exist
if [ ! -d ".next/standalone" ]; then
    echo "🔨 Building app..."
    # Cap memory during build — Pi 2 has 1GB RAM
    NODE_OPTIONS="--max-old-space-size=512" npm run build
fi

# 4. Start production server with memory cap
echo "🚀 Starting production server..."
export NODE_OPTIONS="--max-old-space-size=256"
export NODE_ENV="production"
node .next/standalone/server.js
