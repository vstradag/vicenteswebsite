/** Decrypt AES-CBC encrypted assets. From red1-for-hek/developer-portfolio */

async function generateAESKey(password: string): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password);
  const hashedBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
  const keyBuffer = hashedBuffer.slice(0, 32);
  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function decryptFile(
  url: string,
  password: string
): Promise<ArrayBuffer> {
  const response = await fetch(url);
  const encryptedData = await response.arrayBuffer();
  const iv = encryptedData.slice(0, 16);
  const data = encryptedData.slice(16);
  const key = await generateAESKey(password);
  return crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data);
}
