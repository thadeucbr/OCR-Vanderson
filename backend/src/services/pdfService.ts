// @ts-ignore - pdf-parse doesn't have type definitions
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { renderAndPreprocessPDF, preprocessImageForVision } from './imageRenderingService.js';

// pdfjs will be loaded dynamically inside functions to use the ESM/legacy build safely

// Minimal history & navigator polyfills used by some PDF libraries
if (typeof (global as any).history === 'undefined') {
  (global as any).history = { pushState: () => {}, replaceState: () => {}, state: null };
}
if (typeof (global as any).navigator === 'undefined') {
  (global as any).navigator = { userAgent: 'node.js' };
}

// pdfjs will be loaded dynamically inside functions to use the ESM/legacy build safely

export interface TextExtractionResult {
  text: string;
  method: 'pdfjs' | 'tesseract' | 'vision' | 'none';
  confidence: number;
  charCount: number;
}

export async function extractTextFromPDF(pdfBuffer: Buffer, fileName?: string): Promise<TextExtractionResult> {
  let extractedText = '';
  const file = fileName || 'unknown.pdf';

  console.log(`\n📄 [${file}] Starting extraction...`);
  
  // Try method 1: pdf-parse text extraction
  // We use pdf-parse instead of direct pdfjs-dist to avoid version conflicts with pdf-to-png-converter
  try {
    console.log(`  ↳ Attempting pdf-parse text extraction...`);
    
    const data = await pdfParse(pdfBuffer);
    extractedText = sanitizeText(data.text);
    const charCount = extractedText.trim().length;
    
    console.log(`  ✓ pdf-parse text: ${charCount} characters extracted`);

    if (charCount > 50) {
      console.log(`  ✅ Using pdf-parse text result (${charCount} chars)`);
      return {
        text: extractedText,
        method: 'pdfjs',
        confidence: 100,
        charCount
      };
    }

    console.log(`  ⚠️  Text is too short or empty. Attempting Tesseract OCR...`);
    const ocrResult = await extractTextWithTesseractOCR(pdfBuffer);
    if (ocrResult.text.trim().length > 0) {
      return { ...ocrResult, method: 'tesseract' };
    }

    return { text: '', method: 'none', confidence: 0, charCount: 0 };
  } catch (error) {
    console.log(`  ✗ pdf-parse text extraction failed: ${(error as Error).message}`);
    const ocrResult = await extractTextWithTesseractOCR(pdfBuffer);
    return { ...ocrResult, method: 'tesseract' };
  }
}

async function extractTextWithTesseractOCR(pdfBuffer: Buffer): Promise<{ text: string; confidence: number; charCount: number }> {
  try {
    console.log(`  ↳ Starting Tesseract OCR...`);
    // Render pages to images using new high-quality renderer
    const preprocessed = await renderAndPreprocessPDF(pdfBuffer);
    const allText: string[] = [];
    let processedPages = 0;
    let skippedPages = 0;
    let totalConfidence = 0;

    for (const page of preprocessed) {
      try {
        console.log(`    tesseract: processing page ${page.pageNum}...`);
        const result = await Tesseract.recognize(page.imageBuffer, 'por'); // Portuguese
        const text = result.data.text.trim();
        const confidence = result.data.confidence || 0;

        // Only accept text with minimum confidence
        if (text.length > 0 && confidence > 50) {
          allText.push(text);
          console.log(
            `      ✓ Extracted ${text.length} chars (confidence: ${confidence.toFixed(1)}%)`
          );
          processedPages++;
          totalConfidence += confidence;
        } else if (text.length === 0) {
          console.log(`      ⚠️  No text found (confidence: ${confidence.toFixed(1)}%)`);
          skippedPages++;
        }
      } catch (pageErr) {
        console.log(`      ✗ Page ${page.pageNum} OCR failed: ${(pageErr as Error).message}`);
        skippedPages++;
      }
    }

    const finalText = sanitizeText(allText.join('\n'));
    const avgConfidence = processedPages > 0 ? totalConfidence / processedPages : 0;
    
    console.log(
      `  ✓ Tesseract OCR: ${finalText.length} characters (avg confidence: ${avgConfidence.toFixed(1)}%)`
    );

    // Quality check: If text is very short AND confidence is low, discard it to force Vision fallback
    if (finalText.length < 20 && avgConfidence < 60) {
      console.log(`  ⚠️  OCR result too poor (<20 chars, <60% conf). Discarding to use Vision.`);
      return { text: '', confidence: avgConfidence, charCount: 0 };
    }

    return { text: finalText, confidence: avgConfidence, charCount: finalText.length };
  } catch (error) {
    console.log(`  ✗ Tesseract OCR failed: ${(error as Error).message}`);
    return { text: '', confidence: 0, charCount: 0 };
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\x00/g, '') // Remove null characters
    .replace(/\n/g, ' ') // Replace newlines with space
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/\s+/g, ' ') // Multiple whitespace to single
    .trim();
}
