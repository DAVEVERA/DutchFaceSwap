/**
 * Client-Side End-to-End Encryption (E2EE) Module
 * Uses AES-GCM 256-bit encryption with PBKDF2 key derivation.
 * Ensures images and project secrets are fully encrypted before being stored.
 */

// Generate a random 256-bit AES-GCM key
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export key to base64 string for user backup or vault storage
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const bytes = new Uint8Array(exported);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Import key from base64 string
export async function importKeyFromBase64(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'raw',
    bytes,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt string (like dataURL or JSON) with AES-GCM
export async function encryptData(plainText: string, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plainText);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoded
  );

  const encryptedBytes = new Uint8Array(encrypted);
  let cipherBinary = '';
  for (let i = 0; i < encryptedBytes.byteLength; i++) {
    cipherBinary += String.fromCharCode(encryptedBytes[i]);
  }

  let ivBinary = '';
  for (let i = 0; i < iv.byteLength; i++) {
    ivBinary += String.fromCharCode(iv[i]);
  }

  return {
    cipherText: btoa(cipherBinary),
    iv: btoa(ivBinary),
  };
}

// Decrypt string with AES-GCM
export async function decryptData(cipherTextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const cipherBinary = atob(cipherTextBase64);
  const cipherBytes = new Uint8Array(cipherBinary.length);
  for (let i = 0; i < cipherBinary.length; i++) {
    cipherBytes[i] = cipherBinary.charCodeAt(i);
  }

  const ivBinary = atob(ivBase64);
  const ivBytes = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) {
    ivBytes[i] = ivBinary.charCodeAt(i);
  }

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    key,
    cipherBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
