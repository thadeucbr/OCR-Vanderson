import mongoose from 'mongoose';
import { AnalysisResult } from '../types/analysis.js';

const analysisSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['ok', 'divergencies', 'error'], required: true },
    message: { type: String, required: true },
    pdfContents: [
      {
        fileName: String,
        personalData: {
          cpf: String,
          nome: String,
          endereco: String,
          telefone: String,
          email: String,
        },
        vehicleData: {
          chassi: String,
          marca: String,
          modelo: String,
          placa: String,
          ano: String,
          cor: String,
        },
        metadata: {
          method: String,
          textLength: Number,
          confidence: Number,
          renderTimeMs: Number,
          ocrTimeMs: Number,
        },
      },
    ],
    divergencies: [
      {
        type: { type: String, enum: ['missing_field', 'inconsistent_data', 'invalid_format', 'anomaly'] },
        field: String,
        file1: String,
        file2: String,
        value1: String,
        value2: String,
        description: String,
      },
    ],
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Analysis = mongoose.model<AnalysisResult>('Analysis', analysisSchema);

export async function saveAnalysis(result: AnalysisResult) {
  const analysis = new Analysis(result);
  return await analysis.save();
}

export async function getAnalysisById(id: string) {
  return await Analysis.findById(id);
}

export async function getAllAnalyses(limit: number = 10, skip: number = 0) {
  return await Analysis.find().sort({ timestamp: -1 }).limit(limit).skip(skip);
}

export async function countAnalyses() {
  return await Analysis.countDocuments();
}
