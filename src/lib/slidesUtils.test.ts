import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToGoogleSlides } from './slidesUtils';

describe('slidesUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToGoogleSlides', () => {
    it('creates presentation, adds slides, fetches page layout elements, and inserts text', async () => {
      const accessToken = 'mock_oauth_token';
      const slideOutline = [
        {
          title: 'Slide 1 Title',
          purpose: 'Slide 1 Purpose',
          bullets: ['Bullet 1A', 'Bullet 1B'],
        },
        {
          title: 'Slide 2 Title',
          purpose: 'Slide 2 Purpose',
          bullets: ['Bullet 2A'],
        },
      ];

      // Setup mock fetch sequence
      const mockFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        // Mock 1: Create Presentation
        if (url === 'https://slides.googleapis.com/v1/presentations' && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ presentationId: 'new_presentation_id_123' }),
          });
        }
        
        // Mock 2: BatchUpdate layout create
        if (url === 'https://slides.googleapis.com/v1/presentations/new_presentation_id_123:batchUpdate' && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          // If body contains createSlide layout requests
          if (body.requests?.[0]?.createSlide) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({}),
            });
          }
          // If body contains insertText requests
          if (body.requests?.[0]?.insertText) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({}),
            });
          }
        }

        // Mock 3: Fetch updated presentation placeholders
        if (url === 'https://slides.googleapis.com/v1/presentations/new_presentation_id_123' && init?.method === undefined) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              presentationId: 'new_presentation_id_123',
              slides: [
                // slide at index 0 is default title slide
                { objectId: 'default_slide_0', pageElements: [] },
                // slide 1 corresponds to slideOutline[0]
                {
                  objectId: 'slide_0',
                  pageElements: [
                    { objectId: 'title_placeholder_0', shape: { placeholder: { type: 'TITLE' } } },
                    { objectId: 'body_placeholder_0', shape: { placeholder: { type: 'BODY' } } },
                  ],
                },
                // slide 2 corresponds to slideOutline[1]
                {
                  objectId: 'slide_1',
                  pageElements: [
                    { objectId: 'title_placeholder_1', shape: { placeholder: { type: 'TITLE' } } },
                    { objectId: 'body_placeholder_1', shape: { placeholder: { type: 'BODY' } } },
                  ],
                },
              ],
            }),
          });
        }

        return Promise.reject(new Error(`Unhandled mock fetch call to: ${url}`));
      });

      global.fetch = mockFetch;

      const resultUrl = await exportToGoogleSlides(accessToken, slideOutline);

      // Verify return URL is correct
      expect(resultUrl).toBe('https://docs.google.com/presentation/d/new_presentation_id_123/edit');

      // Verify mock fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1. Create, 2. Add slides, 3. Refetch presentation, 4. Insert text

      // Check create call headers
      const createCall = mockFetch.mock.calls[0];
      expect(createCall[0]).toBe('https://slides.googleapis.com/v1/presentations');
      expect(createCall[1]?.headers).toEqual({
        Authorization: 'Bearer mock_oauth_token',
        'Content-Type': 'application/json',
      });

      // Check text update call content
      const textUpdateCall = mockFetch.mock.calls[3];
      expect(textUpdateCall[0]).toBe('https://slides.googleapis.com/v1/presentations/new_presentation_id_123:batchUpdate');
      const textUpdatePayload = JSON.parse(textUpdateCall[1]?.body as string);
      
      // Verify slides content insertion requests
      expect(textUpdatePayload.requests).toContainEqual({
        insertText: {
          objectId: 'title_placeholder_0',
          text: 'Slide 1 Title',
        },
      });
      expect(textUpdatePayload.requests).toContainEqual({
        insertText: {
          objectId: 'body_placeholder_0',
          text: 'Slide 1 Purpose\n\n• Bullet 1A\n• Bullet 1B\n',
        },
      });
      expect(textUpdatePayload.requests).toContainEqual({
        insertText: {
          objectId: 'title_placeholder_1',
          text: 'Slide 2 Title',
        },
      });
      expect(textUpdatePayload.requests).toContainEqual({
        insertText: {
          objectId: 'body_placeholder_1',
          text: 'Slide 2 Purpose\n\n• Bullet 2A\n',
        },
      });
    });

    it('throws error if presentation creation fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      await expect(exportToGoogleSlides('token', [])).rejects.toThrow('Failed to create presentation');
    });
  });
});
