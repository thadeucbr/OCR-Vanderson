import { Router, Request, Response } from 'express';
import busboy from 'busboy';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { analyzeZipFile } from '../services/analysisService.js';
import { saveAnalysis, getAnalysisById, getAllAnalyses, countAnalyses } from '../models/analysis.js';

const router = Router();

// POST /api/analyze - Upload ZIP and analyze
router.post(
  '/analyze',
  asyncHandler(async (req: Request, res: Response) => {
    const bb = busboy({ headers: req.headers });
    const chunks: Buffer[] = [];
    let zipFileReceived = false;

    bb.on('file', (_fieldname, file, _info) => {
      zipFileReceived = true;
      file.on('data', (data) => {
        chunks.push(data);
      });
    });

    await new Promise<void>((resolve, reject) => {
      bb.on('close', resolve);
      bb.on('error', reject);
      req.pipe(bb);
    });

    if (!zipFileReceived || chunks.length === 0) {
      throw new AppError(400, 'Nenhum arquivo foi enviado');
    }

    const zipBuffer = Buffer.concat(chunks);

    // Analyze the ZIP file
    const result = await analyzeZipFile(zipBuffer);

    // Save to database
    const savedAnalysis = await saveAnalysis(result);

    res.status(200).json({
      success: true,
      analysisId: savedAnalysis._id,
      ...result,
    });
  })
);

// GET /api/analyses/:id - Get analysis by ID
router.get(
  '/analyses/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const analysis = await getAnalysisById(id);

    if (!analysis) {
      throw new AppError(404, 'Análise não encontrada');
    }

    res.status(200).json({
      success: true,
      data: analysis,
    });
  })
);

// GET /api/analyses - Get all analyses with pagination
router.get(
  '/analyses',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const analyses = await getAllAnalyses(limit, skip);
    const total = await countAnalyses();

    res.status(200).json({
      success: true,
      data: analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

export default router;
