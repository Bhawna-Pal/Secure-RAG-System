import { answerQuestion } from '../services/query.service.js';

export const handleQuery = async (req, res, next) => {
  try {
    const { question, topK = 3, documentId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required and must be a non-empty string.',
      });
    }

    const result = await answerQuestion(question.trim(), Number(topK), documentId);

    return res.status(200).json({
      success: true,
      data: {
        question: question.trim(),
        documentId: documentId || null,
        answer: result.answer,
        sources: result.sources,
      },
    });
  } catch (error) {
    console.error('[Query Controller Error]:', error);
    next(error);
  }
};