// Encryption and transformation utilities
class PasswordManager {
  constructor() {
    // Shift value for the cipher
    this.SHIFT = 5;
    
    // Character mapping for substitution
    this.charMap = new Map();
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const reversed = alphabet.split('').reverse().join('');
    
    // Create forward and reverse mappings
    alphabet.split('').forEach((char, i) => {
      this.charMap.set(char, reversed[i]);
      this.charMap.set(char.toUpperCase(), reversed[i].toUpperCase());
    });
  }

  // Transform a single character
  transformChar(char) {
    // If it's a letter, use the substitution map
    if (this.charMap.has(char)) {
      return this.charMap.get(char);
    }
    // If it's a number, add 5 (wrapping around if necessary)
    if (/[0-9]/.test(char)) {
      return String((parseInt(char) + this.SHIFT) % 10);
    }
    // Keep special characters as is
    return char;
  }

  // Transform entire password
  transformPassword(password) {
    return password.split('')
      .map(char => this.transformChar(char))
      .join('');
  }

  // Generate a salt for the master password
  async generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash the master password with salt
  async hashMasterPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Encrypt data using the master password
  async encrypt(data, masterPassword) {
    const salt = await this.generateSalt();
    const key = await this.hashMasterPassword(masterPassword, salt);
    const encryptedData = this.transformPassword(data);
    return {
      salt,
      data: encryptedData
    };
  }
}

// Export the PasswordManager
window.PasswordManager = PasswordManager; 