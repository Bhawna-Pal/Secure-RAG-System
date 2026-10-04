import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitTextIntoChunks = async (rawText, metadata = {}) => {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments(
    [rawText],
    [metadata]
  );

  // Fallback: agar kisi wajah se docs empty bane toh rawText ka 1 chunk bana de
  if (!docs || docs.length === 0) {
    return [{
      content: rawText.trim(),
      chunkIndex: 0,
      metadata
    }];
  }

  return docs.map((doc, index) => ({
    content: doc.pageContent,
    chunkIndex: index,
    metadata: doc.metadata,
  }));
};
