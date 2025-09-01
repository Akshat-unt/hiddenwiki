# 🚀 HiddenWiki Chat - Quick Start Guide

Get your anonymous chat application running in 5 minutes!

## ⚡ Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd hiddenwiki-chat
npm install
cd server && npm install && cd ..
```

### 2. Environment Setup
```bash
# Copy and edit environment file
cp env.example .env.local

# Edit .env.local with your MongoDB connection
# For local MongoDB: MONGODB_URI=mongodb://localhost:27017/hiddenwiki
# For MongoDB Atlas: MONGODB_URI_ATLAS=your-connection-string
```

### 3. Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services
```

### 4. Initialize Database
```bash
cd server
node scripts/init-admin.js
cd ..
```

### 5. Run Application
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

### 6. Access the Application
- **Blog Site**: http://localhost:3000
- **Chat Interface**: Access via secret trigger
- **Admin Panel**: Login with admin/admin123

## 🔐 Secret Access Methods

1. **Click Sequence**: Click the logo image 5 times
2. **Secret Phrase**: Type "hiddenwiki" in search bar
3. **Hidden Button**: Click footer elements multiple times

## 👥 Default Users

| Username | Password | Role |
|----------|----------|------|
| admin    | admin123 | Admin |
| alice    | password123 | User |
| bob      | password123 | User |
| carol    | password123 | User |

## 🐳 Docker Quick Start

```bash
# Start everything with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

**Port Already in Use**
```bash
# Kill process using port 3000 or 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Permission Denied**
```bash
# Make setup script executable
chmod +x setup.js
chmod +x start.sh
```

### Reset Database
```bash
# Clear all data and start fresh
cd server
node scripts/init-admin.js --reset
```

## 📱 Features to Try

1. **Secret Access**: Use the trigger methods to access chat
2. **Real-time Chat**: Send messages between users
3. **File Sharing**: Upload encrypted files
4. **Self-Destruct**: Set messages to auto-delete
5. **2FA Setup**: Enable two-factor authentication
6. **Admin Panel**: Manage users and monitor activity

## 🚨 Security Notes

- Change default passwords immediately
- Use strong encryption keys in production
- Enable HTTPS in production
- Regular security updates
- Monitor access logs

## 📞 Need Help?

- Check the full README.md
- Review troubleshooting section
- Create an issue in the repository

---

**Happy Secure Chatting! 🔒💬** 