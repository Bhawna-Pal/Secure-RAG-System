import { Router } from 'express';
import { upload } from '../config/multer.js';
import { processDocument } from '../controllers/document.controller.js';

const router = Router();

router.post('/upload', upload.single('file'), processDocument);

export default router;