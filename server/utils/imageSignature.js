const signatures = [
  { mime: "image/jpeg", matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  { mime: "image/png", matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/gif", matches: (buffer) => buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii")) },
  { mime: "image/webp", matches: (buffer) => buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP" }
];

export function detectImageMimeType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  return signatures.find((signature) => signature.matches(buffer))?.mime || null;
}

export function isValidImageUpload(file) {
  if (!file || !Buffer.isBuffer(file.buffer)) return false;
  const detectedMimeType = detectImageMimeType(file.buffer);
  return Boolean(detectedMimeType && detectedMimeType === file.mimetype);
}