#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 HiddenWiki Chat Application Setup');
console.log('=====================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error('❌ Node.js 16 or higher is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version check passed:', nodeVersion);

// Check if npm is available
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log('✅ npm version:', npmVersion);
} catch (error) {
  console.error('❌ npm is not available. Please install Node.js and npm.');
  process.exit(1);
}

// Create necessary directories
const dirs = ['server/uploads', 'logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Check if .env.local exists
const envFile = '.env.local';
if (!fs.existsSync(envFile)) {
  console.log('\n📝 Creating environment configuration file...');
  
  const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hiddenwiki
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster.mongodb.net/hiddenwiki

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m

# Server Configuration
PORT=3001
NODE_ENV=development

# Encryption Keys
ENCRYPTION_KEY=your-32-character-encryption-key-here
IV_KEY=your-16-character-iv-key

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@hiddenwiki.com

# Session Configuration
SESSION_SECRET=your-session-secret-key
SESSION_TIMEOUT=900000

# 2FA Configuration
TOTP_SECRET=your-totp-secret-key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# External Services (optional)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
`;

  fs.writeFileSync(envFile, envContent);
  console.log(`✅ Created ${envFile}`);
  console.log('⚠️  Please edit this file with your actual configuration values!');
} else {
  console.log(`✅ Environment file ${envFile} already exists`);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
  
  console.log('Installing backend dependencies...');
  execSync('npm install', { cwd: 'server', stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Generate encryption keys
console.log('\n🔐 Generating encryption keys...');

const crypto = require('crypto');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const ivKey = crypto.randomBytes(16).toString('hex');
const jwtSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');
const totpSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ Generated secure encryption keys');

// Update .env.local with generated keys
if (fs.existsSync(envFile)) {
  let envContent = fs.readFileSync(envFile, 'utf8');
  
  envContent = envContent.replace('your-32-character-encryption-key-here', encryptionKey);
  envContent = envContent.replace('your-16-character-iv-key', ivKey);
  envContent = envContent.replace('your-super-secret-jwt-key-change-this-in-production', jwtSecret);
  envContent = envContent.replace('your-session-secret-key', sessionSecret);
  envContent = envContent.replace('your-totp-secret-key', totpSecret);
  
  fs.writeFileSync(envFile, envContent);
  console.log('✅ Updated environment file with generated keys');
}

// Create startup scripts
console.log('\n📝 Creating startup scripts...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'dev:full': 'concurrently \"npm run dev:server\" \"npm run dev\"',
  'dev:server': 'cd server && npm run dev',
  'build:full': 'npm run build && cd server && npm run build',
  'start:full': 'cd server && npm start'
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Added convenient npm scripts');

// Create a simple startup script
const startupScript = `#!/bin/bash
echo "🚀 Starting HiddenWiki Chat Application..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   On macOS: brew services start mongodb-community"
    echo "   On Ubuntu: sudo systemctl start mongod"
    echo "   On Windows: Start MongoDB service"
    exit 1
fi

# Start the application
echo "✅ Starting backend server..."
cd server && npm run dev &
SERVER_PID=$!

echo "✅ Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "🎉 Application started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
wait

# Cleanup
echo "🛑 Stopping services..."
kill $SERVER_PID $FRONTEND_PID 2>/dev/null
echo "✅ All services stopped"
`;

fs.writeFileSync('start.sh', startupScript);
fs.chmodSync('start.sh', '755');
console.log('✅ Created startup script: start.sh');

// Create Windows batch file
const windowsScript = `@echo off
echo 🚀 Starting HiddenWiki Chat Application...

REM Check if MongoDB is running (Windows)
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB service is not running. Please start MongoDB first.
    echo    You can start it from Services or run: net start MongoDB
    pause
    exit /b 1
)

echo ✅ Starting backend server...
cd server && start "HiddenWiki Backend" npm run dev

echo ✅ Starting frontend...
start "HiddenWiki Frontend" npm run dev

echo 🎉 Application started!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo.
echo Press any key to stop all services...
pause >nul

echo 🛑 Stopping services...
taskkill /f /im node.exe >nul 2>&1
echo ✅ All services stopped
`;

fs.writeFileSync('start.bat', windowsScript);
console.log('✅ Created Windows startup script: start.bat');

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env.local with your MongoDB connection string');
console.log('2. Start MongoDB database');
console.log('3. Run the application:');
console.log('   - Linux/macOS: ./start.sh');
console.log('   - Windows: start.bat');
console.log('   - Or manually: npm run dev:full');
console.log('\n🔐 Default admin credentials:');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('\n⚠️  IMPORTANT: Change default passwords in production!');
console.log('\n📚 For more information, see README.md');
console.log('\n�� Happy chatting!'); 