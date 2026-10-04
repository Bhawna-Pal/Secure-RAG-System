import crypto from 'crypto';
import { extractTextFromPdf } from '../services/pdf.service.js';
import { splitTextIntoChunks } from '../services/chunk.service.js';
import { storeChunksInVectorDB } from '../services/vector.service.js';

export const processDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach a valid PDF file.',
      });
    }

    console.log(`[Upload] Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

    // 1. Extract text
    const { text, totalPages } = await extractTextFromPdf(req.file.path);
    console.log(`[PDF Extraction] Total pages: ${totalPages}, Raw text length: ${text ? text.length : 0}`);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No readable text found in the PDF.',
      });
    }

    const documentId = crypto.randomUUID();
    const metadata = {
      filename: req.file.originalname,
      sizeBytes: req.file.size,
      totalPages,
      processedAt: new Date().toISOString(),
    };

    // 2. Create chunks
    const chunks = await splitTextIntoChunks(text, metadata);
    console.log(`[Chunking] Generated ${chunks ? chunks.length : 0} chunks.`);

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to split text into chunks. Text was empty after parsing.',
      });
    }

    // 3. Vector DB Store
    const storageResult = await storeChunksInVectorDB(chunks, documentId);

    return res.status(200).json({
      success: true,
      message: 'PDF uploaded, chunked, and stored in Pinecone successfully',
      data: {
        documentId,
        filename: req.file.originalname,
        totalPages,
        totalChunks: chunks.length,
        insertedVectors: storageResult.insertedCount,
      },
    });
  } catch (error) {
    console.error('[Document Controller Error]:', error);
    next(error);
  }
};
