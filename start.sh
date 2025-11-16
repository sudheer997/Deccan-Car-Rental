#!/bin/bash
set -e

echo "=== Starting Deccan Car Rental ==="

# Check if static files need to be copied
if [ ! -d ".next/standalone/.next/static" ]; then
  echo "Copying static files to standalone directory..."
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || echo "Note: Static already exists or not needed"
fi

if [ ! -d ".next/standalone/public" ]; then
  echo "Copying public files to standalone directory..."
  cp -r public .next/standalone/ 2>/dev/null || echo "Note: Public already exists or not needed"
fi

echo "Starting Next.js server..."
exec node .next/standalone/server.js
