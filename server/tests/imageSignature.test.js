import test from "node:test";
import assert from "node:assert/strict";
import { detectImageMimeType, isValidImageUpload } from "../utils/imageSignature.js";

test("detects supported image formats from file signatures", () => {
  assert.equal(detectImageMimeType(Buffer.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
  assert.equal(detectImageMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectImageMimeType(Buffer.from("GIF89a")), "image/gif");
  assert.equal(detectImageMimeType(Buffer.from("RIFF0000WEBP")), "image/webp");
});

test("rejects MIME spoofing, unknown signatures and non-buffer uploads", () => {
  assert.equal(isValidImageUpload({ mimetype: "image/png", buffer: Buffer.from("not a png") }), false);
  assert.equal(isValidImageUpload({ mimetype: "image/jpeg", buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) }), false);
  assert.equal(isValidImageUpload({ mimetype: "image/jpeg", buffer: "fake" }), false);
  assert.equal(detectImageMimeType("not a buffer"), null);
});