import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import documentRoutes from './routes/document.routes.js'
import { errorHandler } from './middlewares/errorHandler.js';
import queryRoutes from './routes/query.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.use('/api', healthRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/query', queryRoutes);

app.use(errorHandler);

export default app;