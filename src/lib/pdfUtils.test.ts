import { describe, it, expect, vi } from 'vitest';
import { extractTextFromPdf } from './pdfUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => {
  const mockGetTextContent = vi.fn().mockResolvedValue({
    items: [{ str: 'Hello' }, { str: 'World' }],
  });
  
  const mockGetPage = vi.fn().mockResolvedValue({
    getTextContent: mockGetTextContent,
  });

  const mockGetDocument = vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: mockGetPage,
    }),
  });

  return {
    getDocument: mockGetDocument,
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  };
});

describe('pdfUtils', () => {
  describe('extractTextFromPdf', () => {
    it('should parse PDF contents page by page and aggregate the extracted text', async () => {
      // Mock File object
      const mockFile = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      // Spy or mock arrayBuffer
      const mockArrayBuffer = new ArrayBuffer(8);
      vi.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(mockArrayBuffer);

      const result = await extractTextFromPdf(mockFile);

      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ data: mockArrayBuffer });
      expect(result).toBe('Hello World\n\nHello World\n\n');
    });
  });
});
