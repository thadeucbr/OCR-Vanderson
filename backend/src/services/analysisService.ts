import { extractZipBuffer } from './zipService.js';
import { extractTextFromPDF, sanitizeText } from './pdfService.js';
import { renderPDFForVision } from './imageRenderingService.js';
import { extractDataWithAI, extractDataFromImage, detectDivergencies } from '../config/openai.js';
import { AnalysisResult, PDFContent, Divergency } from '../types/analysis.js';

export async function analyzeZipFile(zipBuffer: Buffer): Promise<AnalysisResult> {
  try {
    // 1. Extract PDF files from ZIP
    console.log(`\n🔍 Starting ZIP analysis. Buffer size: ${zipBuffer.length} bytes`);
    const files = await extractZipBuffer(zipBuffer);
    console.log(`✓ Found ${files.length} PDF files in ZIP`);

    if (files.length === 0) {
      return {
        status: 'error',
        message: 'Nenhum arquivo PDF encontrado no ZIP',
        pdfContents: [],
        divergencies: [],
        timestamp: new Date(),
      };
    }

    files.forEach((f, idx) => console.log(`  ${idx + 1}. ${f.name} (${f.content.length} bytes)`));

    // 2. Extract text from each PDF
    const extractedDataWithNames: Array<{ fileName: string; data: any }> = [];
    const pdfContents: PDFContent[] = [];

    for (const file of files) {
      try {
        console.log(`\n📄 Processing: ${file.name}`);
        const startTime = Date.now();
        const extractionResult = await extractTextFromPDF(file.content, file.name);
        const cleanText = sanitizeText(extractionResult.text);
        const ocrTime = Date.now() - startTime;

        console.log(`\n   📊 Text extraction summary:`);
        console.log(`      • Total characters: ${cleanText.length}`);
        console.log(`      • Method: ${extractionResult.method} (Confidence: ${extractionResult.confidence.toFixed(1)}%)`);

        const isLowConfidence = extractionResult.confidence < 80;

        if (cleanText.length > 100 && !isLowConfidence) {
          console.log(`      • Status: ✅ GOOD (enough text for AI)`);
          console.log(`      • Preview: "${cleanText.substring(0, 150)}..."`);
        } else if (cleanText.length > 0 && !isLowConfidence) {
          console.log(`      • Status: ⚠️  SHORT (${cleanText.length} chars - using what we have)`);
          console.log(`      • Preview: "${cleanText}"`);
        } else {
          if (isLowConfidence && cleanText.length > 0) {
            console.log(`      • Status: ⚠️  LOW CONFIDENCE (${extractionResult.confidence.toFixed(1)}% < 80%) - switching to Vision`);
          } else {
            console.log(`      • Status: ⚠️  EMPTY/POOR (will render pages and try vision model)`);
          }
        }

        // 3. Use AI to extract structured data
        let aiExtracted: any = null;

        if (cleanText.length === 0 || isLowConfidence) {
          console.log(`\n   🖼️ ${isLowConfidence && cleanText.length > 0 ? 'Low confidence text' : 'No text found'}: rendering pages and sending images to OpenAI vision model...`);
          const rendered = await renderPDFForVision(file.content);
          const pageResults: any[] = [];

          for (const page of rendered) {
            try {
              console.log(`\n   🤖 Sending page ${page.pageNum} image to OpenAI (gpt-4o-mini)...`);
              const pageData = await extractDataFromImage(page.imageBuffer, file.name, page.pageNum);
              pageResults.push(pageData);
            } catch (pageErr) {
              console.log(`   ✗ OpenAI image analysis failed for page ${page.pageNum}: ${(pageErr as Error).message}`);
            }
          }

          // Merge page results: prefer values that have evidence (non-empty)
          const merged = {
            personalData: {},
            vehicleData: {},
          } as any;

          for (const pr of pageResults) {
            if (!pr) continue;
            const evidence = pr.evidence || {};

            for (const k of Object.keys(pr.personalData || {})) {
              const val = pr.personalData[k];
              const ev = evidence[k];
              if (val && ev && ev.toString().trim().length > 0 && !merged.personalData[k]) {
                merged.personalData[k] = val;
              }
            }

            for (const k of Object.keys(pr.vehicleData || {})) {
              const val = pr.vehicleData[k];
              const ev = evidence[k];
              if (val && ev && ev.toString().trim().length > 0 && !merged.vehicleData[k]) {
                merged.vehicleData[k] = val;
              }
            }
          }

          // Validate common fields using evidence patterns to avoid hallucinations
          function validateFieldByEvidence(field: string, value: any, evidence: string | undefined) {
            if (!value || !evidence || evidence.toString().trim().length === 0) return null;
            const ev = evidence.toString();
            if (field === 'cpf') {
              const digits = ev.replace(/[^0-9]/g, '');
              if (digits.length === 11) return value;
              return null;
            }
            if (field === 'chassi') {
              const v = ev.replace(/[^A-Za-z0-9]/g, '');
              if (v.length >= 11 && v.length <= 20) return value; // VIN-like
              return null;
            }
            if (field === 'ano') {
              const m = ev.match(/(19|20)\d{2}/);
              if (m) return value;
              return null;
            }
            if (field === 'email') {
              if (/@/.test(ev)) return value;
              return null;
            }
            if (field === 'telefone' || field === 'placa') {
              if (/[0-9]/.test(ev)) return value;
              return null;
            }
            // For nome, endereco, modelo, cor - accept if evidence has at least 3 chars
            if (ev.trim().length >= 3) return value;
            return null;
          }

          // Apply validation to merged fields using collected evidences from pageResults
          const collectedEvidence: any = {};
          for (const pr of pageResults) {
            if (!pr || !pr.evidence) continue;
            for (const k of Object.keys(pr.evidence)) {
              if (!collectedEvidence[k] && pr.evidence[k]) collectedEvidence[k] = pr.evidence[k];
            }
          }

          for (const k of Object.keys(merged.personalData || {})) {
            merged.personalData[k] = validateFieldByEvidence(k, merged.personalData[k], collectedEvidence[k]);
          }
          for (const k of Object.keys(merged.vehicleData || {})) {
            merged.vehicleData[k] = validateFieldByEvidence(k, merged.vehicleData[k], collectedEvidence[k]);
          }

          aiExtracted = merged;
        } else {
          console.log(`\n   🤖 Sending to OpenAI for structured data extraction...`);
          aiExtracted = await extractDataWithAI(cleanText, file.name);
        }

        const hasPersonalData = aiExtracted?.personalData && Object.values(aiExtracted.personalData || {}).some((v: any) => v !== null && v !== undefined && v !== '');
        const hasVehicleData = aiExtracted?.vehicleData && Object.values(aiExtracted.vehicleData || {}).some((v: any) => v !== null && v !== undefined && v !== '');

        console.log(`   ✓ OpenAI extraction complete:`);
        if (hasPersonalData) console.log(`      • Personal Data: ✅ Found`);
        if (hasVehicleData) console.log(`      • Vehicle Data: ✅ Found`);
        if (!hasPersonalData && !hasVehicleData) console.log(`      • Data: ⚠️  No structured data extracted`);

        extractedDataWithNames.push({
          fileName: file.name,
          data: aiExtracted,
        });

        pdfContents.push({
          fileName: file.name,
          personalData: aiExtracted.personalData || {},
          vehicleData: aiExtracted.vehicleData || {},
          metadata: {
            method: (cleanText.length === 0 || isLowConfidence) ? 'vision' : extractionResult.method,
            textLength: cleanText.length,
            confidence: (cleanText.length === 0 || isLowConfidence) ? 100 : extractionResult.confidence,
            ocrTimeMs: ocrTime,
            renderTimeMs: 0 // Tracked inside render services if needed
          }
        });
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error);
        return {
          status: 'error',
          message: `Erro ao processar arquivo ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          pdfContents: [],
          divergencies: [],
          timestamp: new Date(),
        };
      }
    }

    // 4. Detect divergencies (if more than 1 PDF)
    let divergencies: Divergency[] = [];

    if (extractedDataWithNames.length > 1) {
      console.log(`\n📊 Comparing ${extractedDataWithNames.length} documents for divergencies...`);
      divergencies = await detectDivergencies(extractedDataWithNames);

      console.log(`✅ Divergency analysis complete:`);
      console.log(`   • Total divergencies found: ${divergencies.length}`);

      if (divergencies.length > 0) {
        divergencies.forEach((div, idx) => {
          console.log(`   ${idx + 1}. ${div.field} (${div.type})`);
          console.log(`      ├─ ${div.file1}: "${div.value1}"`);
          if (div.file2) console.log(`      ├─ ${div.file2}: "${div.value2}"`);
          console.log(`      └─ ${div.description}`);
        });
      } else {
        console.log(`   ℹ️  No divergencies found - all documents match`);
      }
    } else {
      console.log(`\n ℹ️  Only ${extractedDataWithNames.length} document(s) - skipping divergency check`);
    }

    // 5. Determine final status
    const hasDivergencies = divergencies.length > 0;
    const status = hasDivergencies ? 'divergencies' : 'ok';

    const message = hasDivergencies
      ? `Documentos analisados: ${files.length}. Divergências encontradas: ${divergencies.length}`
      : `Documentos analisados: ${files.length}. ✓ Todos os documentos estão aptos para prosseguimento.`;

    console.log(`\n✅ Analysis complete. Status: ${status}`);

    return {
      status,
      message,
      pdfContents,
      divergencies,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error analyzing ZIP:', error);
    return {
      status: 'error',
      message: `Erro ao analisar ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`,
      pdfContents: [],
      divergencies: [],
      timestamp: new Date(),
    };
  }
}
