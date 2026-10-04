import { GoogleGenAI } from '@google/genai';
import { similaritySearch } from './vector.service.js';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }
  return new GoogleGenAI({ apiKey });
};

export const answerQuestion = async (queryText, topK = 3, documentId = null) => {
  // 1. Pinecone se relevant chunks fetch karein
  const matches = await similaritySearch(queryText, topK, documentId);

  if (!matches || matches.length === 0) {
    return {
      answer: 'The provided document does not contain relevant information for this question.',
      sources: [],
    };
  }

  // 2. Chunks ko context string mein combine karein
  const context = matches
    .map(
      (m, idx) =>
        `[Chunk ${idx + 1} - Source: ${m.metadata?.filename || 'Document'}]:\n${m.text}`
    )
    .join('\n\n---\n\n');

  // 3. Grounded Prompt
  const prompt = `
You are a precise, secure, and helpful AI assistant. Answer the user's question STRICTLY based on the provided DOCUMENT CONTEXT below.

RULES:
1. Rely only on the facts directly mentioned in the context. Do not assume, extrapolate, or fabricate information.
2. If the context does not contain enough information to answer the question, clearly state: "The provided document does not contain this information."
3. Present your answer in a clear, well-structured, and bulleted format where appropriate.

DOCUMENT CONTEXT:
${context}

USER QUESTION:
${queryText}

ANSWER:
`;

  // 4. Gemini se answer generate karwayein
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  });

  const answer = response.text || 'Unable to generate response.';

  return {
    answer,
    sources: matches.map((m) => ({
      id: m.id,
      score: m.score,
      filename: m.metadata?.filename,
      chunkIndex: m.metadata?.chunkIndex,
      snippet: m.text?.slice(0, 150) + '...',
    })),
  };
};