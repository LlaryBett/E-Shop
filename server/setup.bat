@echo off
REM E-Shop Backend Development Setup Script for Windows

echo 🚀 Starting E-Shop Backend Setup...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚙️  Creating .env file from template...
    copy .env.example .env
    echo ✅ Please configure your .env file with the correct values
)

REM Create logs directory if it doesn't exist
if not exist "logs" (
    echo 📁 Creating logs directory...
    mkdir logs
)

REM Create uploads directory if it doesn't exist
if not exist "uploads" (
    echo 📁 Creating uploads directory...
    mkdir uploads
)

echo ✅ Setup completed!
echo.
echo 🔧 Available commands:
echo    npm run dev     - Start development server with nodemon
echo    npm start       - Start production server
echo    npm run seed    - Seed database with sample data
echo    npm test        - Run tests
echo.
echo 📋 Before starting:
echo    1. Configure your .env file
echo    2. Make sure MongoDB is running
echo    3. Set up your Stripe, Cloudinary, and email accounts
echo.
echo 🎯 To start development server: npm run dev
pause
