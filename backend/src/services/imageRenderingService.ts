import { pdfToPng } from 'pdf-to-png-converter';
import sharp from 'sharp';

const MIN_IMAGE_SIZE = 30000; // 30KB minimum for valid image
const MAX_DPI_SCALE = 2.0; // 150 DPI equivalent

export interface RenderedPage {
  pageNum: number;
  imageBuffer: Buffer;
  width: number;
  height: number;
  originalSize: number;
}

export interface PreprocessedImage {
  pageNum: number;
  imageBuffer: Buffer;
  width: number;
  height: number;
  preprocessedSize: number;
}

/**
 * Renderiza PDFs para imagens PNG de alta qualidade usando pdf-to-png-converter
 * @param pdfBuffer - Buffer do PDF
 * @param dpiScale - Escala de DPI (1.5 = 150 DPI, 2.0 = 200 DPI)
 * @returns Array com páginas renderizadas
 */
export async function renderPDFToImages(
  pdfBuffer: Buffer,
  dpiScale: number = 1.5
): Promise<RenderedPage[]> {
  const renderedPages: RenderedPage[] = [];

  try {
    console.log(`\n🖼️ Starting PDF-to-PNG rendering (scale=${dpiScale})...`);
    
    const startTime = Date.now();
    const pngPages = await pdfToPng(pdfBuffer as any, {
      viewportScale: dpiScale,
      processPagesInParallel: false, // Sequential for stability
    });

    console.log(`   ✓ Rendered ${pngPages.length} pages`);

    for (const page of pngPages) {
      try {
        const imageBuffer = page.content;
        const pageNum = page.pageNumber;
        const width = page.width;
        const height = page.height;

        // Validate image buffer
        if (!imageBuffer || imageBuffer.length < MIN_IMAGE_SIZE) {
          console.log(
            `   ⚠️  Page ${pageNum}: Image too small (${imageBuffer?.length || 0} bytes, min: ${MIN_IMAGE_SIZE})`
          );
          continue;
        }

        renderedPages.push({
          pageNum,
          imageBuffer,
          width,
          height,
          originalSize: imageBuffer.length,
        });

        console.log(
          `   ✓ Page ${pageNum}: ${imageBuffer.length} bytes (${width}x${height}px)`
        );
      } catch (err) {
        console.log(`   ✗ Page ${page.pageNumber}: ${(err as Error).message}`);
      }
    }

    const renderTime = Date.now() - startTime;
    console.log(`   🕐 Rendering completed in ${renderTime}ms`);

    if (renderedPages.length === 0) {
      throw new Error('No valid pages were rendered from PDF');
    }

    return renderedPages;
  } catch (error) {
    console.log(`   ✗ PDF rendering failed: ${(error as Error).message}`);
    if ((error as Error).message.includes('match the Worker version')) {
      console.log(`     💡 Tip: This is usually caused by conflicting pdfjs-dist versions. Check if GlobalWorkerOptions is being set globally.`);
    }
    throw error;
  }
}

/**
 * Pré-processa imagens para melhorar OCR e Vision accuracy
 * - Aumenta contraste
 * - Aplica sharpening
 * - Otimiza size para lossless PNG
 * @param imageBuffer - Buffer da imagem original
 * @param pageNum - Número da página
 * @returns Imagem pré-processada
 */
export async function preprocessImageForOCR(
  imageBuffer: Buffer,
  pageNum: number
): Promise<PreprocessedImage> {
  try {
    console.log(`   📐 Preprocessing page ${pageNum}...`);

    // Enhance contrast and sharpen for OCR
    const processed = await sharp(imageBuffer)
      .normalise() // Auto-contrast enhancement
      .median(1) // Reduce noise (denoise)
      .sharpen({ sigma: 1.5 })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    console.log(
      `      • Original: ${imageBuffer.length} bytes → Processed: ${processed.length} bytes`
    );

    return {
      pageNum,
      imageBuffer: processed,
      width: 0, // Will be set by metadata if needed
      height: 0,
      preprocessedSize: processed.length,
    };
  } catch (err) {
    console.log(`   ✗ Preprocessing failed for page ${pageNum}: ${(err as Error).message}`);
    // Return original if preprocessing fails
    return {
      pageNum,
      imageBuffer,
      width: 0,
      height: 0,
      preprocessedSize: imageBuffer.length,
    };
  }
}

/**
 * Pré-processa imagens para melhorar Vision API accuracy
 * - Otimiza tamanho mantendo qualidade
 * - Usa JPEG 95% se imagem > 300KB
 * @param imageBuffer - Buffer da imagem original
 * @param pageNum - Número da página
 * @returns Imagem otimizada para Vision
 */
export async function preprocessImageForVision(
  imageBuffer: Buffer,
  pageNum: number
): Promise<PreprocessedImage> {
  try {
    console.log(`   🔍 Optimizing page ${pageNum} for Vision API...`);

    let optimized: Buffer;

    if (imageBuffer.length > 300000) {
      // Use JPEG 95% for large images to reduce size
      optimized = await sharp(imageBuffer)
        .normalise()
        .jpeg({ quality: 95, mozjpeg: true })
        .toBuffer();
      console.log(`      • Converted to JPEG: ${imageBuffer.length} → ${optimized.length} bytes`);
    } else {
      // Use PNG with high compression for small images
      optimized = await sharp(imageBuffer)
        .normalise()
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      console.log(`      • Optimized PNG: ${imageBuffer.length} → ${optimized.length} bytes`);
    }

    return {
      pageNum,
      imageBuffer: optimized,
      width: 0,
      height: 0,
      preprocessedSize: optimized.length,
    };
  } catch (err) {
    console.log(`   ✗ Vision optimization failed for page ${pageNum}: ${(err as Error).message}`);
    // Return original if optimization fails
    return {
      pageNum,
      imageBuffer,
      width: 0,
      height: 0,
      preprocessedSize: imageBuffer.length,
    };
  }
}

/**
 * Renderiza um PDF para imagens de alta qualidade com pré-processamento
 * Wrapper completo do pipeline de renderização para OCR
 * @param pdfBuffer - Buffer do PDF
 * @returns Array com imagens renderizadas e pré-processadas
 */
export async function renderAndPreprocessPDF(
  pdfBuffer: Buffer
): Promise<PreprocessedImage[]> {
  try {
    // Step 1: Render with high DPI (150 DPI)
    const rendered = await renderPDFToImages(pdfBuffer, 1.5);

    // Step 2: Preprocess for OCR
    const preprocessed: PreprocessedImage[] = [];
    for (const page of rendered) {
      const processed = await preprocessImageForOCR(page.imageBuffer, page.pageNum);
      preprocessed.push(processed);
    }

    return preprocessed;
  } catch (error) {
    console.log(`✗ PDF rendering and preprocessing failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Renderiza um PDF para imagens otimizadas para OpenAI Vision
 * Wrapper que renderiza e otimiza imagens para Vision API
 * @param pdfBuffer - Buffer do PDF
 * @returns Array com imagens otimizadas para Vision
 */
export async function renderPDFForVision(
  pdfBuffer: Buffer
): Promise<PreprocessedImage[]> {
  try {
    // Step 1: Render with high DPI (200 DPI for vision)
    const rendered = await renderPDFToImages(pdfBuffer, 2.0);

    // Step 2: Optimize for Vision
    const optimized: PreprocessedImage[] = [];
    for (const page of rendered) {
      const processed = await preprocessImageForVision(page.imageBuffer, page.pageNum);
      optimized.push(processed);
    }

    return optimized;
  } catch (error) {
    console.log(`✗ PDF vision preparation failed: ${(error as Error).message}`);
    throw error;
  }
}
