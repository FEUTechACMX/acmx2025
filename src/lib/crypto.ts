import CryptoJS from "crypto-js";

/**
 * Decrypt AES/ECB/PKCS5Padding Base64 ciphertext
 * @param encrypted Base64-encoded string (from Java encryptor)
 * @param key Secret key (will be padded/truncated to 16 bytes)
 */
export function decryptAES(encrypted: string, key: string): string {
  try {
    // Make key exactly 16 chars like Java
    if (key.length < 16) {
      key = key.padEnd(16, " ");
    } else if (key.length > 16) {
      key = key.substring(0, 16);
    }

    const secretKey = CryptoJS.enc.Utf8.parse(key);

    // Java defaults → AES/ECB/PKCS5Padding
    const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) throw new Error("Invalid key or corrupted payload");
    return plaintext;
  } catch {
    throw new Error("AES decryption failed");
  }
}
