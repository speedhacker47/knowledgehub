import Tesseract from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number; // 0.0 to 1.0
  percent: number;  // 0 to 100
}

/**
 * Extracts text from an image file, blob, or URL using Tesseract OCR.
 *
 * @param imageSource - The File object, Blob, or URL of the image to read.
 * @param onProgress - Optional callback to track OCR loading and recognition progress.
 * @returns The extracted text string ready to be saved as 'searchable_content'.
 */
export async function extractTextFromImage(
  imageSource: File | Blob | string,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      imageSource,
      'eng', // English OCR (can pass 'eng+spa+fra' etc.)
      {
        logger: (m) => {
          if (onProgress) {
            onProgress({
              status: m.status || 'processing',
              progress: typeof m.progress === 'number' ? m.progress : 0,
              percent: Math.round((typeof m.progress === 'number' ? m.progress : 0) * 100),
            });
          }
        },
      }
    );

    const extractedText = (result?.data?.text || '').trim();

    // Log the final extracted text so it can be saved to your database
    console.log('[OCR] Extracted searchable_content:', {
      length: extractedText.length,
      confidence: result?.data?.confidence,
      searchable_content: extractedText,
    });

    return extractedText;
  } catch (error) {
    console.error('[OCR] Failed to extract text from image:', error);
    throw error;
  }
}
