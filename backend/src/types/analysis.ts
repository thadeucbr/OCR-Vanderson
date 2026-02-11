export interface PersonalData {
  cpf?: string;
  nome?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export interface VehicleData {
  chassi?: string;
  marca?: string;
  modelo?: string;
  placa?: string;
  ano?: string;
  cor?: string;
}

export interface ExtractionMetadata {
  method: 'pdfjs' | 'tesseract' | 'vision' | 'none';
  textLength: number;
  confidence: number;
  renderTimeMs?: number;
  ocrTimeMs?: number;
}

export interface PDFContent {
  fileName: string;
  personalData: PersonalData;
  vehicleData: VehicleData;
  metadata?: ExtractionMetadata;
}

export interface Divergency {
  type: 'missing_field' | 'inconsistent_data' | 'invalid_format' | 'anomaly';
  field: string;
  file1: string;
  file2?: string;
  value1?: string;
  value2?: string;
  description: string;
}

export interface AnalysisResult {
  status: 'ok' | 'divergencies' | 'error';
  message: string;
  pdfContents: PDFContent[];
  divergencies: Divergency[];
  timestamp: Date;
}
