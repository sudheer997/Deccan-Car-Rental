#!/bin/bash

# Start the Deccan Car Rental application
echo "Starting Deccan Car Rental..."

# Kill any existing process on port 3000
echo "Checking for existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Wait a moment
sleep 2

# Start the server
echo "Starting Next.js server..."
npm start

echo ""
echo "Server is running!"
echo "Access the application at: http://localhost:3000"
echo "Admin login page: http://localhost:3000/admin-login.html"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
