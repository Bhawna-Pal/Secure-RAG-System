import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';

const getPineconeIndex = async () => {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is missing');
  }

  const pc = new Pinecone({ apiKey });

  const indexName =
    process.env.PINECONE_INDEX_NAME || 'secure-rag-index';

  const indexModel = await pc.indexes.describe(indexName);

  console.log(
    `[Pinecone] Index: ${indexName}`
  );

  console.log(
    `[Pinecone] Host: ${indexModel.host}`
  );

  console.log(
    `[Pinecone] Dimension: ${indexModel.dimension}`
  );

  return pc.index({
    host: indexModel.host,
  });
};
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  return new GoogleGenAI({
    apiKey,
  });
};

const generateEmbedding = async (ai, text) => {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length === 0) {
    throw new Error('Gemini returned an empty embedding');
  }

  return values;
};

export const storeChunksInVectorDB = async (chunks, documentId) => {
  let preparedChunks = [];

  if (Array.isArray(chunks) && chunks.length > 0) {
    preparedChunks = chunks
      .map((c, idx) => {
        let text = '';

        if (typeof c === 'string') {
          text = c;
        } else if (c?.content) {
          text = c.content;
        } else if (c?.pageContent) {
          text = c.pageContent;
        } else if (c?.text) {
          text = c.text;
        }

        return {
          text: (text || '').trim(),
          chunkIndex: c?.chunkIndex ?? idx,
          metadata: c?.metadata || {},
        };
      })
      .filter((c) => c.text.length > 0);
  }

  if (preparedChunks.length === 0) {
    throw new Error('No valid text chunks to store');
  }

  const ai = getGeminiClient();

  console.log(
    `[Vector Service] Embedding ${preparedChunks.length} chunk(s) via Gemini...`
  );

  const vectors = await Promise.all(
    preparedChunks.map((chunk) =>
      generateEmbedding(ai, chunk.text)
    )
  );

  console.log(
    `[Vector Service] Generated ${vectors.length} vectors. Dimension check: ${vectors[0]?.length}`
  );

  const records = preparedChunks.map((chunk, idx) => ({
    id: `${documentId}_chunk_${idx}`,
    values: vectors[idx],
    metadata: {
      documentId: String(documentId),
      chunkIndex: Number(chunk.chunkIndex),
      text: String(chunk.text),
      filename: String(
        chunk.metadata?.filename || 'unknown'
      ),
      processedAt: String(
        chunk.metadata?.processedAt ||
          new Date().toISOString()
      ),
    },
  }));

  console.log(
    `[Vector Service] Records prepared: ${records.length}`
  );

  if (records.length === 0) {
    throw new Error('No records available for Pinecone upsert');
  }

  console.log(
    `[Vector Service] First record ID: ${records[0].id}`
  );

  console.log(
    `[Vector Service] First record dimension: ${records[0].values.length}`
  );

 const index = await getPineconeIndex();

  console.log(
    `[Vector Service] Upserting ${records.length} records to Pinecone...`
  );

await index.upsert({
  records,
});

  console.log(
    `[Vector Service] Successfully stored in Pinecone!`
  );

  return {
    insertedCount: records.length,
  };
};
export const similaritySearch = async (
  queryText,
  topK = 3,
  documentId = null
) => {
  const ai = getGeminiClient();
  const queryVector = await generateEmbedding(ai, queryText);

  const index = await getPineconeIndex();

  const queryOptions = {
    vector: queryVector,
    topK,
    includeMetadata: true,
  };

  // Agar documentId pass ki gayi hai toh query ko scope karein
  if (documentId) {
    queryOptions.filter = {
      documentId: { $eq: String(documentId) },
    };
  }

  const queryResponse = await index.query(queryOptions);

  return queryResponse.matches.map((match) => ({
    id: match.id,
    score: match.score,
    text: match.metadata?.text,
    metadata: match.metadata,
  }));
};