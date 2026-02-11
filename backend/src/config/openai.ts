import { OpenAI } from 'openai';
import { env } from './env.js';

export const openaiClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function extractDataWithAI(pdfContent: string, fileName: string) {
  const message = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert Brazilian insurance document analyzer.
Your task is to extract personal and vehicle data from extracted PDF text with high accuracy.
The PDF text may be from OCR extraction, so it might have errors, character misalignments, or formatting issues.
Still try your best to identify and extract the data.
IMPORTANT: Return the response as VALID JSON ONLY. Do not include markdown code blocks or any other text.
If a field is not found or is empty, set it to null.
Be flexible with field names and formats - look for variations like "CPF" or "CNPJ" or "ID", "Nome" or "Name", etc.
Extract any identifiable data even if formatting is imperfect or OCR corrupted.`,
      },
      {
        role: 'user',
        content: `Analyze this insurance document (extracted via OCR) and extract the following information:

Personal Data:
- CPF or CNPJ or ID number (Brazilian tax ID, can be in formats like XXX.XXX.XXX-XX, XXXXXXXXXXX, or XX.XXX.XXX/XXXX-XX)
- Name or "Nome" (Full name of person or company)
- Address or "Endereço" (Full address, any format)
- Phone or "Telefone" (Phone number, any format)
- Email (Electronic mail)

Vehicle Data (if present):
- Chassis/VIN or "Chassi" (Vehicle identification number, usually 17 characters)
- Brand or "Marca" (Car brand/make like Ford, Volkswagen, Honda, etc)
- Model or "Modelo" (Car model like Gol, Fiesta, Civic, etc)
- License Plate or "Placa" (License plate, format varies)
- Year or "Ano" (Manufacturing year, 4 digits)
- Color or "Cor" (Vehicle color)

Document text (may contain OCR errors):
${pdfContent || '(empty - image-only document)'}

RESPOND ONLY WITH VALID JSON, NO CODE BLOCKS, NO MARKDOWN. Just the raw JSON object:
{
  "personalData": {
    "cpf": "extracted value or null",
    "nome": "extracted value or null",
    "endereco": "extracted value or null",
    "telefone": "extracted value or null",
    "email": "extracted value or null"
  },
  "vehicleData": {
    "chassi": "extracted value or null",
    "marca": "extracted value or null",
    "modelo": "extracted value or null",
    "placa": "extracted value or null",
    "ano": "extracted value or null",
    "cor": "extracted value or null"
  }
}`,
      },
    ],
  });

  let content = message.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  // Remove markdown formatting if present (e.g., ```json ... ```)
  content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

  return JSON.parse(content);
}

export async function extractDataFromImage(imageBuffer: Buffer, fileName: string, pageNum?: number, retryCount = 0): Promise<any> {
  // Validate buffer size (min 30KB for valid document page)
  if (imageBuffer.length < 30000) {
    console.log(`   ⚠️ Image too small for Vision (${imageBuffer.length} bytes). Skipping.`);
    return null;
  }

  const b64 = imageBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${b64}`;
  const message = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are an expert Brazilian insurance document analyzer with vision capabilities.
You will receive an image (as a base64 data URL) representing a scanned document page.
CRITICAL RULES:
- Do NOT guess or invent values. If you cannot confidently read a field from the image, set it to null.
- For each extracted field include an "evidence" entry containing the exact text snippet you read in the image that supports the value (or an empty string if none).
- Also return a top-level "rawText" string with any readable text you can transcribe from the image.
- Return ONLY valid JSON (no markdown/code blocks or extra text).`,
      },
      {
        role: 'user',
        content: `Image (page ${pageNum || 1}) from file ${fileName} below as a base64 data URL. First, transcribe any visible text into "rawText". Then extract these fields and provide an "evidence" string for each field showing the exact characters you used. If you cannot read a field, set it to null and leave its evidence as an empty string. Respond ONLY with JSON in this shape:
{
  "rawText": "...transcribed text...",
  "personalData": { "cpf": null, "nome": null, "endereco": null, "telefone": null, "email": null },
  "vehicleData": { "chassi": null, "marca": null, "modelo": null, "placa": null, "ano": null, "cor": null },
  "evidence": {
    "cpf": "...",
    "nome": "...",
    "endereco": "...",
    "telefone": "...",
    "email": "...",
    "chassi": "...",
    "marca": "...",
    "modelo": "...",
    "placa": "...",
    "ano": "...",
    "cor": "..."
  }
}

Image data:\n${dataUri}`,
      },
    ],
  });

  let content = message.choices[0]?.message?.content;
  
  if (!content) {
    if (retryCount < 1) {
      console.log(`   ⚠️ Vision API returned empty content. Retrying (${retryCount + 1}/1)...`);
      return extractDataFromImage(imageBuffer, fileName, pageNum, retryCount + 1);
    }
    throw new Error('No content in OpenAI response for image');
  }

  content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(content);
}

export async function detectDivergencies(
  allExtractedData: Array<{ fileName: string; data: any }>
) {
  const divergencies: any[] = [];

  if (allExtractedData.length < 2) {
    return divergencies;
  }

  // Filter out documents with no real data
  const validDocuments = allExtractedData.filter(doc => {
    const personalDataValues = Object.values(doc.data.personalData || {}).filter(v => v);
    const vehicleDataValues = Object.values(doc.data.vehicleData || {}).filter(v => v);
    return personalDataValues.length > 0 || vehicleDataValues.length > 0;
  });

  console.log(`Filtering: ${allExtractedData.length} → ${validDocuments.length} documents with actual data`);

  if (validDocuments.length < 2) {
    console.log('Not enough documents with real data to compare');
    return divergencies;
  }

  const message = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a Brazilian insurance document compliance expert.
Analyze the provided extracted data from multiple documents and identify REAL divergencies ONLY.
CRITICAL RULES:
1. IGNORE documents or fields that are completely empty/null - they have no data
2. ONLY COMPARE documents that have actual extracted data
3. Do NOT report null values as divergencies
4. A real divergency is when DIFFERENT documents have DIFFERENT non-null values for the SAME field
5. Be STRICT: Only flag genuine conflicts that indicate problems

Examples of REAL divergencies:
- Document A: cpf="123", Document B: cpf="456" (DIFFERENT non-null values) 
- Document A: cpf="123", Document B: cpf=null (NOT a divergency - B has no data)
- Document A: cpf=null, Document B: cpf=null (NOT a divergency - no data in either)

Return ONLY valid JSON, no additional text.`,
      },
      {
        role: 'user',
        content: `Compare these insurance documents for REAL divergencies:

${validDocuments.map((item, idx) => `Document ${idx + 1} (${item.fileName}):\n${JSON.stringify(item.data, null, 2)}`).join('\n\n')}

Important: Only report genuine inconsistencies between documents with actual data.
Respond with this JSON:
{
  "divergencies": [
    {
      "type": "inconsistent_data",
      "field": "field_name",
      "files": ["file1", "file2"],
      "values": {"file1": "value1", "file2": "value2"},
      "description": "why this is a real problem"
    }
  ]
}`,
      },
    ],
  });

  const content = message.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  const result = JSON.parse(content);
  return result.divergencies || [];
}
