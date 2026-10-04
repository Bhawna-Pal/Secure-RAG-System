import fs from 'fs';
import PDFParser from 'pdf2json';

export const extractTextFromPdf = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on('pdfParser_dataError', (errData) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(new Error(errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const rawText = pdfParser.getRawTextContent();
        const totalPages = pdfParser.data?.Pages?.length || 1;

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        resolve({
          text: rawText,
          totalPages,
          info: {},
        });
      } catch (err) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(err);
      }
    });

    pdfParser.loadPDF(filePath);
  });
};
