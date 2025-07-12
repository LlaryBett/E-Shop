#!/bin/bash

# E-Shop Backend Development Setup Script

echo "🚀 Starting E-Shop Backend Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: brew services start mongodb/brew/mongodb-community"
    echo "   Or: sudo systemctl start mongod"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ Please configure your .env file with the correct values"
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir logs
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir uploads
fi

echo "✅ Setup completed!"
echo ""
echo "🔧 Available commands:"
echo "   npm run dev     - Start development server with nodemon"
echo "   npm start       - Start production server"
echo "   npm run seed    - Seed database with sample data"
echo "   npm test        - Run tests"
echo ""
echo "📋 Before starting:"
echo "   1. Configure your .env file"
echo "   2. Make sure MongoDB is running"
echo "   3. Set up your Stripe, Cloudinary, and email accounts"
echo ""
echo "🎯 To start development server: npm run dev"
