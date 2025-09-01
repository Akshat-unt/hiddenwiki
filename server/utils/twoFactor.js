const crypto = require('crypto');
const qrcode = require('qrcode');

// Generate a new TOTP secret
const generateTOTPSecret = () => {
  return crypto.randomBytes(20).toString('base32');
};

// Generate TOTP code based on secret and time
const generateTOTP = (secret, time = Date.now()) => {
  const timeStep = Math.floor(time / 30000); // 30 second window
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
  timeBuffer.writeUInt32BE(timeStep % 0x100000000, 4);

  const secretBuffer = Buffer.from(secret, 'base32');
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
};

// Verify TOTP code
const verifyTOTP = (secret, code, window = 1) => {
  const now = Date.now();
  
  // Check current time window and adjacent windows for clock skew
  for (let i = -window; i <= window; i++) {
    const time = now + (i * 30000); // 30 second intervals
    const expectedCode = generateTOTP(secret, time);
    
    if (expectedCode === code) {
      return true;
    }
  }
  
  return false;
};

// Generate QR code for authenticator apps
const generateQRCode = async (email, secret, issuer = 'HiddenWiki') => {
  try {
    const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    
    const qrCodeDataURL = await qrcode.toDataURL(otpauth, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate backup codes for 2FA recovery
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Hash backup codes for storage
const hashBackupCodes = (codes) => {
  return codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
};

// Verify backup code
const verifyBackupCode = (code, hashedCodes) => {
  const hashedCode = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  return hashedCodes.includes(hashedCode);
};

module.exports = {
  generateTOTPSecret,
  generateTOTP,
  verifyTOTP,
  generateQRCode,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode
}; 