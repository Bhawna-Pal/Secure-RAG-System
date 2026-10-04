import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName =
  process.env.PINECONE_INDEX_NAME || 'secure-rag-index';

console.log('Index name:', indexName);

const indexModel = await pc.indexes.describe(indexName);

console.log('Index host:', indexModel.host);
console.log('Index dimension:', indexModel.dimension);

const index = pc.index({
  host: indexModel.host,
});

const records = [
  {
    id: 'test-vector-1',
    values: Array(768).fill(0.01),
    metadata: {
      test: 'secure-rag',
    },
  },
];

console.log('Records:', records.length);
console.log('Dimension:', records[0].values.length);

const result = await index.upsert({
  records,
});

console.log('SUCCESS:', result);