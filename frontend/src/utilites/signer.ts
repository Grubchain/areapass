function base64UrlToBase64(input: string): string {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad === 1) b64 += "===";
  return b64;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function importEncryptionKeyFromClientSecret(clientSecret: string): Promise<CryptoKey> {
  const parts = clientSecret.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid client_secret JWT");
  }

  const [, payloadB64Url] = parts;
  const payloadJson = JSON.parse(
    atob(base64UrlToBase64(payloadB64Url))
  );

  const encKeyB64 = payloadJson.enc_key;
  const encAlg = payloadJson.enc_alg || "AES-256-GCM";

  if (!encKeyB64) throw new Error("client_secret has no enc_key");
  if (encAlg !== "AES-256-GCM") throw new Error(`Unsupported enc_alg: ${encAlg}`);

  const keyBytes = base64ToUint8Array(encKeyB64);

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
}

type EncryptedPayload = {
  iv: string;
  ciphertext: string;
  tag: string;
};

export async function encryptCardData(
  cardData: Record<string, unknown>,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(cardData));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  // Split GCM output into ciphertext + tag (last 16 bytes)
  const tagLength = 16;
  if (encryptedBytes.length <= tagLength) {
    throw new Error("Encrypted data too short to contain tag");
  }

  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - tagLength);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - tagLength);

  return {
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(ciphertextBytes),
    tag: uint8ArrayToBase64(tagBytes),
  };
}
