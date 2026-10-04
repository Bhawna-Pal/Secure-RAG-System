import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g,'_');
        cb(null, `${uniqueSuffix}-${sanitizedFilename}`);
    },
});

const fileFilter = (req, file,cb) => {
    if(file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invaild file format. Only PDF files are supported.'), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});