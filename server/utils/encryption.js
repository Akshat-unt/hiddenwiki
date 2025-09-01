const crypto = require('crypto');

// Encryption key and IV (in production, these should be stored securely)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const IV_KEY = process.env.IV_KEY || 'your-16-character-iv-key';

// Encrypt message content
const encryptMessage = (text) => {
  try {
    // Generate a random IV for each message
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted text, and auth tag
    const result = iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt message content
const decryptMessage = (encryptedText) => {
  try {
    // Split the encrypted text into IV, encrypted data, and auth tag
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted message format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY);
    
    // Set the auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

// Generate a new encryption key
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a new IV key
const generateIVKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Hash sensitive data (for passwords, etc.)
const hashData = (data, salt = null) => {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  
  const hash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512');
  return salt + ':' + hash.toString('hex');
};

// Verify hashed data
const verifyHash = (data, hashedData) => {
  const parts = hashedData.split(':');
  if (parts.length !== 2) {
    return false;
  }
  
  const salt = parts[0];
  const hash = parts[1];
  
  const testHash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512');
  return testHash.toString('hex') === hash;
};

// Generate a secure random string
const generateSecureString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate a secure random number
const generateSecureNumber = (min = 0, max = 999999) => {
  const range = max - min;
  const bytes = crypto.randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return min + (value % range);
};

module.exports = {
  encryptMessage,
  decryptMessage,
  generateEncryptionKey,
  generateIVKey,
  hashData,
  verifyHash,
  generateSecureString,
  generateSecureNumber
}; 