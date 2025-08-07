import crypto from 'crypto';

export const generateTimestamp = () => {
  return new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
};

export const generatePassword = (shortCode, passKey, timestamp) => {
  return Buffer.from(shortCode + passKey + timestamp).toString('base64');
};

export const validateIPN = (data, signature) => {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  return hash === signature;
};

// Alternative default export if preferred
export default {
  generateTimestamp,
  generatePassword,
  validateIPN
};