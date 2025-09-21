#!/bin/bash

# Database initialization script for FlockByAttiq
# This script sets up the MongoDB database with default data

echo "🚀 Initializing FlockByAttiq Database..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongod"
    echo "   On Windows: net start MongoDB"
    exit 1
fi

# Install required dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017/flockbyattiq"
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Run the database initialization
echo "🗄️  Setting up database..."
node public/init-database.js

echo "✅ Database initialization completed!"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Email: admin@flockbyattiq.com"
echo "   Password: admin123"
echo ""
echo "🚀 You can now start the application with: npm run dev"
