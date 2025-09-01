# HiddenWiki - Historical Knowledge Platform & Anonymous Chat

A sophisticated dual-purpose application that serves as both a legitimate historical knowledge platform and a completely anonymous chat application. The public-facing site provides comprehensive historical research tools and educational resources, while maintaining hidden secure communication capabilities.

## 🚀 Core Features

### 📚 Historical Knowledge Platform (Public)
- **Wikipedia Integration**: Real-time access to Wikipedia's vast historical database
- **Advanced Search**: Comprehensive search with filters for time periods, regions, and categories
- **Research Tools**: Citation generators, timeline builders, and note-taking systems
- **Educational Features**: Interactive quizzes, study guides, and virtual tours
- **Today in History**: Daily historical events and featured articles
- **Mobile Responsive**: Fully optimized for all devices and screen sizes

### 🔒 Anonymous Chat System (Hidden)
- **Secret Access**: Hidden trigger mechanisms to access secure chat (click sequence or secret phrase)
- **Real-time Chat**: Live messaging with Socket.io integration
- **End-to-End Encryption**: Client-side encryption/decryption for all messages
- **Role-based Access**: Admin and user roles with different permissions
- **Session Management**: Secure JWT-based authentication with auto-timeout

### Security Features
- **Two-Factor Authentication**: TOTP support with Google Authenticator
- **Account Lockout**: Protection against brute force attacks
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation and sanitization
- **CSRF Protection**: Built-in CSRF protection
- **XSS Prevention**: Content Security Policy headers

### Chat Features
- **Direct & Group Chats**: One-on-one and group conversations
- **File Sharing**: Encrypted file uploads with size limits
- **Self-Destructing Messages**: Auto-delete messages after configurable time
- **Read Receipts**: Message read status tracking
- **Typing Indicators**: Real-time typing notifications
- **Message Reactions**: Emoji reactions to messages

### Privacy Features
- **Message Visibility**: Chats hidden after logout
- **No Message History**: Messages not accessible post-logout
- **Admin Monitoring**: Admin can view encrypted versions for security
- **Audit Logs**: Comprehensive logging for admin review

### 🎓 Educational & Research Features
- **Historical Dictionary**: Comprehensive glossary with etymology and cross-references
- **Interactive Timeline**: Explore historical events across different time periods
- **Virtual Museum Tours**: 360° tours of historical sites and archaeological discoveries
- **Academic Citations**: Automatic citation generation in multiple formats (MLA, APA, Chicago)
- **Research Notes**: Integrated note-taking system for historical research
- **Bookmarking System**: Save and organize historical articles and resources

### 🌐 Wikipedia Integration
- **Live Search**: Real-time search with intelligent suggestions
- **Featured Articles**: Daily featured historical content from Wikipedia
- **Random Discovery**: Explore random historical articles and topics
- **Related Content**: Intelligent recommendations for related historical topics
- **Multi-category Browse**: Explore content by historical periods, regions, and themes
- **Historical Events**: "On This Day" historical events for every date

### 💻 Technical Features
- **Progressive Web App**: Offline capabilities and app-like experience
- **TypeScript**: Full type safety and enhanced development experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG 2.1 compliant with screen reader support
- **Performance**: Optimized loading with caching and lazy loading
- **Push Notifications**: Browser notifications for new messages
- **Theme Support**: Light/dark theme options
- **Multi-language**: Internationalization support
- **Backup Codes**: 2FA recovery codes

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **Material-UI**: Component library for consistent design
- **Socket.io Client**: Real-time communication
- **CryptoJS**: Client-side encryption
- **React Hot Toast**: Notifications
- **TypeScript**: Type safety

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Socket.io**: Real-time communication
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing

### Security & Utilities
- **Helmet**: Security headers
- **Express Rate Limit**: API rate limiting
- **Express Validator**: Input validation
- **Multer**: File upload handling
- **OTPLib**: Two-factor authentication
- **QRCode**: QR code generation

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn
- Git

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hiddenwiki-chat
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment file
cp env.example .env.local

# Edit environment variables
nano .env.local
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/hiddenwiki
MONGODB_URI_ATLAS=mongodb+srv://username:password@cluster.mongodb.net/hiddenwiki

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here
IV_KEY=your-16-character-iv-key

# Admin Account
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@hiddenwiki.com
```

### 4. Database Setup
```bash
# Start MongoDB (if local)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI_ATLAS in .env.local
```

### 5. Initialize Admin User
```bash
cd server
node scripts/init-admin.js
cd ..
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### Production Mode
```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

## 🔐 Accessing the Chat

### Secret Trigger Methods

1. **Click Sequence**: Click the logo image 5 times in succession
2. **Secret Phrase**: Type "hiddenwiki" in the search bar
3. **Hidden Button**: Click specific footer elements multiple times

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123
- **Role**: admin

### Adding Users
1. Login as admin
2. Navigate to admin panel
3. Use the user registration endpoint
4. Or modify the initialization script

## 📱 Usage Guide

### For Regular Users
1. Visit the blog site
2. Use secret trigger to access login
3. Enter credentials provided by admin
4. Start chatting with other users
5. Messages are automatically encrypted
6. Logout hides all chat history

### For Admins
1. Access admin panel after login
2. Manage users and permissions
3. Monitor chat activity
4. View system statistics
5. Manage blog content
6. Access audit logs

### Chat Features
- **Send Messages**: Type and press Enter
- **File Uploads**: Click attachment icon
- **Self-Destruct**: Enable timer for messages
- **Reactions**: React to messages with emojis
- **Group Chats**: Create and manage group conversations

## 🔒 Security Considerations

### Encryption
- All messages encrypted client-side
- AES-256-GCM encryption algorithm
- Unique IV for each message
- Keys stored securely in environment

### Authentication
- JWT tokens with short expiration
- 2FA support for additional security
- Account lockout after failed attempts
- Secure password requirements

### Privacy
- No message persistence after logout
- Admin access limited to encrypted versions
- Comprehensive audit logging
- Rate limiting and abuse prevention

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
npm test

# Backend tests
cd server
npm test
```

### Test Coverage
```bash
# Frontend coverage
npm run test:coverage

# Backend coverage
cd server
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Railway/Heroku (Backend)
```bash
# Set environment variables
# Deploy using platform-specific commands
```

### Docker
```bash
# Build image
docker build -t hiddenwiki-chat .

# Run container
docker run -p 3000:3000 -p 3001:3001 hiddenwiki-chat
```

## 📁 Project Structure

```
hiddenwiki-chat/
├── app/                    # Next.js frontend
│   ├── chat/             # Chat interface
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (blog facade)
├── server/                # Backend server
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── handlers/         # Socket.io handlers
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── public/                # Static assets
├── package.json           # Frontend dependencies
├── server/package.json    # Backend dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Customization Options
- **Blog Content**: Modify fake articles in database
- **Secret Triggers**: Change trigger mechanisms
- **Encryption**: Modify encryption algorithms
- **UI Theme**: Customize Material-UI theme
- **Rate Limits**: Adjust API rate limiting

### Environment Variables
See `env.example` for all available configuration options.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check MongoDB service status
   - Verify connection string in .env.local
   - Ensure network access for Atlas

2. **JWT Token Errors**
   - Verify JWT_SECRET in environment
   - Check token expiration settings
   - Clear browser storage

3. **Socket.io Connection Issues**
   - Verify backend server is running
   - Check CORS configuration
   - Ensure proper authentication

4. **Encryption Errors**
   - Verify ENCRYPTION_KEY and IV_KEY
   - Check key length requirements
   - Ensure consistent encryption setup

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is designed for educational and personal use. Users are responsible for ensuring compliance with local laws and regulations regarding privacy, encryption, and communication.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

## 🔄 Updates

Stay updated with the latest features and security patches by regularly pulling from the repository.

---

**Built with ❤️ for secure, private communication** 