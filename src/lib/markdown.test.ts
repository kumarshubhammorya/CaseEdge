import { describe, it, expect, vi } from 'vitest';

// Mock the sounds library to bypass side effects (localStorage and AudioContext) during unit tests
vi.mock('../lib/sounds', () => {
  return {
    sounds: {
      playClick: vi.fn(),
      playSuccess: vi.fn(),
      playError: vi.fn(),
      playAdd: vi.fn(),
      playRemove: vi.fn(),
      playTransition: vi.fn(),
    }
  };
});

import { 
  formatInlineMarkdown, 
  renderHtmlTable, 
  convertMarkdownToHtml 
} from '../components/IntakeSection';

describe('markdown and table formatting helpers', () => {
  describe('formatInlineMarkdown', () => {
    it('should correctly format bold **text**', () => {
      expect(formatInlineMarkdown('This is **bold** text.'))
        .toBe('This is <strong class="font-bold text-slate-200">bold</strong> text.');
    });

    it('should correctly format bold __text__', () => {
      expect(formatInlineMarkdown('This is __bold__ text.'))
        .toBe('This is <strong class="font-bold text-slate-200">bold</strong> text.');
    });

    it('should correctly format italics *text*', () => {
      expect(formatInlineMarkdown('This is *italic* text.'))
        .toBe('This is <em class="italic text-slate-300">italic</em> text.');
    });

    it('should correctly format italics _text_', () => {
      expect(formatInlineMarkdown('This is _italic_ text.'))
        .toBe('This is <em class="italic text-slate-300">italic</em> text.');
    });

    it('should handle mixed bold and italics', () => {
      const result = formatInlineMarkdown('**Bold** and *Italic* together.');
      expect(result).toContain('<strong class="font-bold text-slate-200">Bold</strong>');
      expect(result).toContain('<em class="italic text-slate-300">Italic</em>');
    });
  });

  describe('renderHtmlTable', () => {
    it('should parse GFM tables with leading and trailing pipes', () => {
      const rows = [
        '| Header 1 | Header 2 |',
        '| --- | --- |',
        '| Val 1 | Val 2 |'
      ];
      const html = renderHtmlTable(rows);
      expect(html).toContain('<th class="py-2 px-3">Header 1</th>');
      expect(html).toContain('<th class="py-2 px-3">Header 2</th>');
      expect(html).toContain('<td class="py-2 px-3">Val 1</td>');
      expect(html).toContain('<td class="py-2 px-3">Val 2</td>');
    });

    it('should parse GFM tables without leading or trailing pipes', () => {
      const rows = [
        'Header 1 | Header 2',
        '--- | ---',
        'Val 1 | Val 2'
      ];
      const html = renderHtmlTable(rows);
      expect(html).toContain('<th class="py-2 px-3">Header 1</th>');
      expect(html).toContain('<th class="py-2 px-3">Header 2</th>');
      expect(html).toContain('<td class="py-2 px-3">Val 1</td>');
      expect(html).toContain('<td class="py-2 px-3">Val 2</td>');
    });

    it('should apply inline formatting inside table cells', () => {
      const rows = [
        'Header 1',
        '---',
        '**Bold Cell**'
      ];
      const html = renderHtmlTable(rows);
      expect(html).toContain('<strong class="font-bold text-slate-200">Bold Cell</strong>');
    });
  });

  describe('convertMarkdownToHtml', () => {
    it('should format headers with optional leading spaces and trailing hashes', () => {
      const h1 = convertMarkdownToHtml('# Title');
      const h2 = convertMarkdownToHtml('  ## Background ##');
      expect(h1).toContain('text-base font-extrabold text-white');
      expect(h1).toContain('Title');
      expect(h2).toContain('text-xs font-bold text-cyan-400');
      expect(h2).toContain('Background');
    });

    it('should format unordered list items with indentation', () => {
      const list = convertMarkdownToHtml('* Item 1\n  - Item 2\n    * Item 3');
      expect(list).toContain('pl-2');
      expect(list).toContain('pl-4');
      expect(list).toContain('pl-6');
      expect(list).toContain('Item 1');
      expect(list).toContain('Item 2');
      expect(list).toContain('Item 3');
    });

    it('should format ordered list items with numbers and indentation', () => {
      const list = convertMarkdownToHtml('1. First Item\n  2. Second Item');
      expect(list).toContain('First Item');
      expect(list).toContain('Second Item');
      expect(list).toContain('1.');
      expect(list).toContain('2.');
      expect(list).toContain('font-mono text-[10px]');
    });

    it('should format full paragraphs and inline styles', () => {
      const text = convertMarkdownToHtml('This is a simple paragraph with **bold** text.');
      expect(text).toContain('This is a simple paragraph with <strong class="font-bold text-slate-200">bold</strong> text.');
    });
  });
});
