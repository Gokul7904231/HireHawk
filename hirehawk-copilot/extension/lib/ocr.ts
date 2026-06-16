/**
 * OCR Engine (Tesseract.js integration placeholder)
 * 
 * NOTE: Version 2 Feature Roadmap.
 * This module is stubbed out for the MVP and is not currently wired into the extension data flow.
 */
export async function performOcr(imageBlob: Blob): Promise<string> {
  console.log("OCR performs request stub (v2 roadmap) - skipping raw image analysis");
  return Promise.resolve("Mock OCR output: Extracted job description text from image.");
}
